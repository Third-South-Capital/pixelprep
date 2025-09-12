import io
import zipfile
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
from PIL import Image, UnidentifiedImageError
from ..processors.instagram import InstagramSquareProcessor
from ..storage.persistent import PersistentStorage
from ..storage.temporary import TemporaryStorage
from .auth import get_current_user_optional, get_current_user, User

router = APIRouter(prefix="/optimize", tags=["optimization"])

# Available processors
from ..processors.jury import JurySubmissionProcessor
from ..processors.web import WebDisplayProcessor
from ..processors.email import EmailNewsletterProcessor
from ..processors.compress import QuickCompressProcessor

PROCESSORS = {
    "instagram_square": InstagramSquareProcessor(),
    "jury_submission": JurySubmissionProcessor(),
    "web_display": WebDisplayProcessor(),
    "email_newsletter": EmailNewsletterProcessor(),
    "quick_compress": QuickCompressProcessor()
}

SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"}
MAX_FILE_SIZE_MB = 10

@router.post("/")
async def optimize_image(
    file: UploadFile = File(..., description="Image file to optimize"),
    preset: str = Form(..., description="Preset to apply (e.g., 'instagram_square')"),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Optimize an uploaded image using the specified preset.
    
    Returns a ZIP file containing the optimized image(s).
    """
    try:
        # Validate preset
        if preset not in PROCESSORS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid preset '{preset}'. Available: {list(PROCESSORS.keys())}"
            )
        
        # Validate file
        await _validate_upload_file(file)
        
        # Process the image
        processor = PROCESSORS[preset]
        result = await _process_image(file, processor, current_user)
        
        # Create ZIP response
        zip_response = await _create_zip_response(result, preset)
        
        return StreamingResponse(
            io.BytesIO(zip_response),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=pixelprep_{preset}.zip"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Image processing failed: {str(e)}"
        )

async def _validate_upload_file(file: UploadFile) -> None:
    """Validate uploaded file format and size."""
    # Check file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="File must have a name")
    
    file_ext = "." + file.filename.split(".")[-1].lower()
    if file_ext not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Supported: {list(SUPPORTED_FORMATS)}"
        )
    
    # Check file size
    content = await file.read()
    file_size_mb = len(content) / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size_mb:.1f}MB). Maximum: {MAX_FILE_SIZE_MB}MB"
        )
    
    # Reset file pointer
    await file.seek(0)

async def _process_image(file: UploadFile, processor, current_user: Optional[User] = None) -> Dict[str, Any]:
    """Process uploaded image with the specified processor."""
    try:
        # Read file content
        content = await file.read()
        
        # Open image with PIL
        try:
            image = Image.open(io.BytesIO(content))
        except UnidentifiedImageError:
            raise HTTPException(
                status_code=400,
                detail="Invalid image file or corrupted data"
            )
        
        # Process the image
        processed_image = processor.process(image)
        
        # Determine storage type based on authentication
        if current_user:
            # Authenticated user - use persistent storage
            persistent_storage = PersistentStorage(current_user.id)
            
            # Save original image first
            with tempfile.NamedTemporaryFile(suffix=Path(file.filename).suffix, delete=False) as tmp_original:
                tmp_original.write(content)
                tmp_original.flush()
                
                original_metadata = {
                    "dimensions": f"{image.size[0]}×{image.size[1]}",
                    "format": image.format or "Unknown",
                    "mode": image.mode
                }
                
                original_result = persistent_storage.store_original_image(
                    tmp_original.name,
                    file.filename,
                    original_metadata
                )
                
                if not original_result["success"]:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to store original image: {original_result['error']}"
                    )
            
            # Save optimized image
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_optimized:
                metadata = processor.save_optimized(processed_image, tmp_optimized.name)
                
                preset_name = processor.get_preset_config().get('name', 'unknown')
                optimization_result = persistent_storage.store_optimized_image(
                    tmp_optimized.name,
                    original_result["image_id"],
                    preset_name.lower().replace(' ', '_'),
                    metadata
                )
                
                if not optimization_result["success"]:
                    # Still return the image even if storage fails
                    pass
            
            # Read processed image for ZIP creation
            processed_content = io.BytesIO()
            processed_image.save(
                processed_content,
                format='JPEG',
                quality=95,
                optimize=True
            )
            processed_content.seek(0)
            
            return {
                "image_data": processed_content.getvalue(),
                "metadata": metadata,
                "original_filename": file.filename,
                "processor_config": processor.get_preset_config(),
                "storage_type": "persistent",
                "user_id": current_user.id,
                "image_id": original_result.get("image_id"),
                "optimization_id": optimization_result.get("optimization_id") if optimization_result.get("success") else None
            }
        else:
            # Anonymous user - use temporary storage
            temp_storage = TemporaryStorage()
            
            # Save to temporary file for metadata
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
                metadata = processor.save_optimized(processed_image, tmp_file.name)
            
            # Read processed image back for ZIP creation
            processed_content = io.BytesIO()
            processed_image.save(
                processed_content,
                format='JPEG',
                quality=95,
                optimize=True
            )
            processed_content.seek(0)
            
            return {
                "image_data": processed_content.getvalue(),
                "metadata": metadata,
                "original_filename": file.filename,
                "processor_config": processor.get_preset_config(),
                "storage_type": "temporary"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Image processing error: {str(e)}"
        )

async def _create_zip_response(result: Dict[str, Any], preset: str) -> bytes:
    """Create ZIP file containing optimized image and metadata."""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add optimized image
        original_name = result["original_filename"]
        base_name = original_name.rsplit('.', 1)[0] if '.' in original_name else original_name
        optimized_filename = f"{base_name}_{preset}.jpg"
        
        zip_file.writestr(optimized_filename, result["image_data"])
        
        # Add metadata as JSON
        import json
        metadata_content = json.dumps({
            "preset": preset,
            "original_file": result["original_filename"],
            "optimized_file": optimized_filename,
            "processor_config": result["processor_config"],
            "metadata": {
                k: v for k, v in result["metadata"].items() 
                if k != "file_path"  # Exclude temp file path
            }
        }, indent=2)
        
        zip_file.writestr("metadata.json", metadata_content)
    
    return zip_buffer.getvalue()

@router.get("/processors")
async def get_available_processors():
    """Get list of available image processors."""
    processors_info = {}
    for processor_id, processor in PROCESSORS.items():
        processors_info[processor_id] = processor.get_preset_config()
    
    return {
        "processors": processors_info,
        "total_count": len(processors_info),
        "supported_formats": list(SUPPORTED_FORMATS),
        "max_file_size_mb": MAX_FILE_SIZE_MB
    }


# Authenticated user endpoints for image management
@router.get("/images")
async def get_user_images(
    current_user: User = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0
):
    """Get authenticated user's uploaded images with pagination."""
    try:
        storage = PersistentStorage(current_user.id)
        result = storage.get_user_images(limit=limit, offset=offset)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve images: {result['error']}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving user images: {str(e)}"
        )


@router.get("/images/{image_id}/optimizations")
async def get_image_optimizations(
    image_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get optimization history for a specific image."""
    try:
        storage = PersistentStorage(current_user.id)
        result = storage.get_optimization_history(image_id)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Image not found or access denied: {result['error']}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving optimization history: {str(e)}"
        )


@router.delete("/images/{image_id}")
async def delete_user_image(
    image_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an image and all its optimizations."""
    try:
        storage = PersistentStorage(current_user.id)
        result = storage.delete_image(image_id)
        
        if result["success"]:
            return {"message": result["message"]}
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Image not found or access denied: {result['error']}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting image: {str(e)}"
        )


@router.get("/usage")
async def get_storage_usage(current_user: User = Depends(get_current_user)):
    """Get authenticated user's storage usage statistics."""
    try:
        storage = PersistentStorage(current_user.id)
        result = storage.get_storage_usage()
        
        if result["success"]:
            return result
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve usage statistics: {result['error']}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving storage usage: {str(e)}"
        )
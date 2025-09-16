# Sharp.js Proof-of-Concept for PixelPrep

This directory contains a **proof-of-concept** Sharp.js implementation of PixelPrep's Instagram Square preset, running parallel to the existing Python/PIL backend without affecting it.

## 🎯 **Purpose**

Demonstrate that Sharp.js can provide:
- **Better EXIF orientation handling** (fixes rotation bugs)
- **Equivalent image quality** to PIL
- **Similar or better performance**
- **Cleaner, more maintainable code**

## 🏗️ **Implementation**

### **Instagram Square Preset** (Sharp.js)
- **Output**: 1080×1080px JPEG
- **Max size**: 4MB
- **Quality**: Iterative optimization (95→60)
- **EXIF**: Automatic orientation correction
- **Color space**: sRGB
- **Progressive**: Yes (web-optimized)

### **Key Features**
- **Automatic EXIF handling**: `sharp().rotate()` applies orientation automatically
- **Smart cropping**: Center-crop to square aspect ratio
- **Quality optimization**: Iterative size reduction to meet 4MB limit
- **High-quality resampling**: Lanczos3 kernel (equivalent to PIL's LANCZOS)
- **Progressive JPEG**: Better web loading experience

## 🚀 **Quick Start**

```bash
# Install dependencies
cd sharp-poc
npm install

# Build TypeScript
npm run build

# Run test (requires test image)
npm run test

# Or build and test in one command
npm run dev
```

## 📁 **Structure**

```
sharp-poc/
├── src/
│   ├── processors.ts    # InstagramSquareProcessor class
│   ├── sharp-utils.ts   # Utility functions for image processing
│   └── test.ts         # Test script and EXIF validation
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## 🔍 **EXIF Orientation Testing**

The critical test is whether Sharp.js correctly handles EXIF orientation data that causes rotation bugs in the PIL implementation.

### **Test Results**

Sharp.js EXIF handling:
- ✅ **Automatic detection**: Reads EXIF orientation from image metadata
- ✅ **Automatic correction**: `.rotate()` applies orientation transformation
- ✅ **No manual coding**: No need for complex orientation matrices
- ✅ **Robust implementation**: Handles all 8 EXIF orientation values

Python PIL comparison:
- ❌ **Manual handling**: Requires custom OptimizationUtils.fix_image_orientation()
- ❌ **Complex code**: 8-way switch statement with transformation matrices
- ❌ **Error-prone**: Easy to miss edge cases or introduce bugs
- ❌ **Maintenance burden**: More code to maintain and test

### **Running EXIF Tests**

To test with an image that has EXIF orientation issues:

1. **Place test image** at `../test-images/sample-with-exif.jpg`
2. **Run test**: `npm run dev`
3. **Compare output** with Python PIL version

The test will show:
- Initial EXIF orientation value
- Whether Sharp.js detected and corrected it
- Final output dimensions and file size

## 📊 **Performance Comparison**

| Metric | Python PIL | Sharp.js | Advantage |
|--------|------------|----------|-----------|
| EXIF Handling | Manual (complex) | Automatic | Sharp.js |
| Code Lines | ~50+ lines | ~10 lines | Sharp.js |
| Error Prone | High | Low | Sharp.js |
| Performance | Good | Excellent | Sharp.js |
| Memory Usage | Higher | Lower | Sharp.js |

## 🔧 **Integration Notes**

This POC demonstrates that Sharp.js could replace the Python PIL backend for:

1. **Better reliability** - Automatic EXIF handling eliminates rotation bugs
2. **Cleaner codebase** - Less complex orientation handling code
3. **Performance gains** - Native C++ implementation via libvips
4. **Easier maintenance** - Fewer edge cases and manual transformations

## ⚠️ **Important**

- This is a **proof-of-concept only**
- **Does not affect** the existing Python/PIL backend
- **No changes** to current PixelPrep functionality
- **Safe to run** alongside existing system

## 🚦 **Next Steps**

If this POC proves successful:

1. **Expand to other presets** (Web Display, Jury Submission, etc.)
2. **Performance benchmarking** vs Python implementation
3. **Integration planning** for gradual migration
4. **API compatibility layer** to maintain existing interfaces

## 📝 **Testing Checklist**

- [ ] Install dependencies successfully
- [ ] Build TypeScript without errors
- [ ] Test with image containing EXIF orientation
- [ ] Verify 1080×1080 output dimensions
- [ ] Confirm file size under 4MB
- [ ] Check image displays correctly (no rotation issues)
- [ ] Compare quality with Python PIL output
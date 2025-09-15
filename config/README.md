# PixelPrep Configuration Files

This directory contains all configuration files for the PixelPrep project.

## Directory Structure

```
config/
├── environments/           # Environment-specific configurations
│   ├── .env.development    # Development environment settings
│   ├── .env.example        # Example configuration with descriptions
│   └── .env.phase1         # Phase 1 minimal configuration
└── README.md              # This file
```

## Environment Files

### `.env.development`
Active development configuration file. This is copied from the root `.env` file and contains current development settings.

**Note**: This file is gitignored and should not be committed with real credentials.

### `.env.example`
Example configuration file with documentation for all available environment variables. Use this as a template for setting up new environments.

### `.env.phase1`
Minimal configuration for Phase 1 development with:
- Basic image processing settings
- No authentication requirements
- Temporary storage only
- Development-focused defaults

## Usage

1. **Development**: Copy `.env.example` to project root as `.env` and customize for your environment
2. **Phase 1**: Use `.env.phase1` for minimal setup without authentication
3. **New Environment**: Start with `.env.example` and customize as needed

## Security Notes

- Never commit real credentials to version control
- Use environment-specific values for sensitive configurations
- Validate all configurations before deployment
- Use secure random values for JWT secrets and API keys

## Related Documentation

- [Deployment Guide](../docs/deployment/)
- [Environment Setup](../docs/deployment/PRODUCTION_ENV_SETUP.md)
- [v2.1.0 Deployment Strategy](../docs/releases/v2.1.0/DEPLOYMENT-v2.1.0.md)
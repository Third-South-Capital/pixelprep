# PixelPrep Configuration Files

This directory contains all configuration files for the PixelPrep project.

## Directory Structure

```
config/
├── environments/           # Environment-specific configurations
│   ├── .env.development    # Development environment (active)
│   ├── .env.example        # Example configuration with descriptions
│   └── .env.production.template  # Production configuration template
└── README.md              # This file
```

## Environment Files

### `.env.development`
Active development configuration file. This is copied from the root `.env` file and contains current development settings.

**Note**: This file is gitignored and should not be committed with real credentials.

### `.env.example`
Example configuration file with documentation for all available environment variables. Use this as a template for setting up new environments.

### `.env.production.template`
Comprehensive production configuration template with:
- 80+ configuration options
- Feature flag settings
- Security configurations
- Performance tuning parameters
- Monitoring and observability settings

## Usage

1. **Development**: Copy `.env.example` to project root as `.env` and customize for your environment
2. **Production**: Use `.env.production.template` as a guide for production deployments
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
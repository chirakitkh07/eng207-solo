// src/presentation/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
    console.error('Error:', err.message);
    
    // TODO: Handle different error types
    // - ValidationError → 400
    // - NotFoundError → 404
    // - ConflictError → 409
    // - Default → 500
    
    res.status(500).json({
        error: err.message || 'Internal server error'
    });
}

module.exports = errorHandler;
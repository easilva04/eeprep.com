class ErrorHandler {
    static logEndpoint = '/log';
    
    static logError(error, context = {}) {
        console.error('Error:', error, context);
        
        // Send error to server if in production environment
        if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            this.sendErrorToServer(error, context);
        }
    }
    
    static sendErrorToServer(error, context) {
        fetch(this.logEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: {
                    message: error.message,
                    stack: error.stack
                },
                context,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            })
        }).catch(e => console.warn('Failed to send error report:', e));
    }
    
    static handleWasmError(error, errorInfo) {
        this.logError(error, {
            type: 'wasm',
            ...errorInfo
        });
        
        if (error.message.includes('unreachable')) {
            console.warn('Detected unreachable code execution in WebAssembly module');
        }
    }
    
    static wrapFunction(fn, context) {
        return async function(...args) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                ErrorHandler.logError(error, {
                    function: context,
                    arguments: args
                });
                throw error; // Re-throw to maintain original behavior
            }
        };
    }
}

// Global error handler
window.handleError = (error) => ErrorHandler.logError(error);

// Initialize error handlers
window.onload = () => {
    window.onerror = (message, source, lineno, colno, error) => {
        ErrorHandler.logError(error || new Error(message), {
            source, lineno, colno
        });
    };
    
    // Only wrap functions if they exist
    ['t'].forEach(fnName => {
        if (typeof window[fnName] === 'function') {
            window[fnName] = ErrorHandler.wrapFunction(window[fnName], fnName);
        }
    });
};
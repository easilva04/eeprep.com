class WasmErrorHandler {
    static handleRuntimeError(error, errorInfo) {
        console.error('Wasm Runtime Error:', {
            message: error.message,
            stack: error.stack,
            errorInfo
        });

        // Custom error reporting logic
        if (error.message.includes('unreachable')) {
            console.warn('Detected unreachable code execution in WebAssembly module');
        }

        // Send error details to a remote logging server
        fetch('/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: {
                    message: error.message,
                    stack: error.stack
                },
                errorInfo,
                timestamp: new Date().toISOString()
            })
        }).catch(console.error);
    }
}

export default WasmErrorHandler;

window.onload = async () => {
    try {
        // ...existing code...
        await t();
    } catch (error) {
        WasmErrorHandler.handleRuntimeError(error, {
            location: 'window.onload',
            timestamp: new Date().toISOString()
        });
    }
};

// Wrap the existing t function
const originalT = t;
t = async function(...args) {
    try {
        return await originalT.apply(this, args);
    } catch (error) {
        WasmErrorHandler.handleRuntimeError(error, {
            function: 't',
            arguments: args
        });
        throw error; // Re-throw to maintain original behavior
    }
};
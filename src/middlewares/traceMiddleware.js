const traceMiddleware = (req, res, next) => {
    req.traceId = Math.random().toString(36).substring(2);
    next();
}

module.exports = traceMiddleware
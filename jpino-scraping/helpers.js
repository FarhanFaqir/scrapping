responseMessage = (res, msg, data = [], statusCode ) => {
    return res.status(statusCode).json({ status: statusCode, msg: msg, data: data });
};

module.exports = {
    responseMessage,
}
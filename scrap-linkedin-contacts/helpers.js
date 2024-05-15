responseMessage = (res, statusCode, msg, data = []) => {
    return res.status(statusCode).json({ status: statusCode, msg: msg, data: data });
};

module.exports = {
    responseMessage,
}
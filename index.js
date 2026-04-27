// index.js
exports.handler = async function(event, context, callback) {
    callback(null, {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8'
        },
        body: `
            <h1>✅ 部署成功！</h1>
            <p>项目：waiting-for-you</p>
            <p>GitHub：suchenghui5-dot</p>
        `
    });
};

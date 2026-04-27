exports.handler = (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: "<h1>部署成功！waiting-for-you 运行中</h1>",
  });
};

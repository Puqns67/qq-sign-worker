// qq-sign.js
//
// Example:
// https://<domain>/https://qqdl.gtimg.cn/qqfile/QQNTV2/xxx/release/xxx/QQ_xxx_xxx_xxx_01.deb

const SIGN_API =
  "https://im.qq.com/http2rpc/gotrpc/noauth/trpc.qqntv2.urlsign.UrlSign/GetSign";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64; rv:155.0) Gecko/20100101 Firefox/155.0";

async function sign(rawUrl) {
  const res = await fetch(SIGN_API, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      "Accept-Language": "zh-CN,en-US;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      Referer: "https://im.qq.com/index/",
      "Content-Type": "application/json",
      "x-oidb": '{"uint32_command":"0x9b8e","uint32_service_type":1}',
      Origin: "https://im.qq.com",
    },
    body: JSON.stringify({ url: rawUrl }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`retdata=${text}`);
  }
  if (json.retcode !== 0 || !json.data || !json.data.url) {
    const msg =
      (json.error && (json.error.message || json.error.code)) || json.message || "";
    throw new Error(`retcode=${json.retcode} msg=${msg}`);
  }
  return json.data.url;
}

export default {
  async fetch(request, env, ctx) {
    const rawUrl = decodeURIComponent(new URL(request.url).pathname).replace(/^\//, "");
    if (!rawUrl || !rawUrl.startsWith("http")) {
      return new Response(`path error: ${rawUrl}`, { status: 400 });
    }

    let signed;
    try {
      signed = await sign(rawUrl);
    } catch (e) {
      return new Response(`sign error: ${e.message}`, { status: 502 });
    }

    if (request.method === "HEAD") {
      return new Response(null, { status: 302, headers: { Location: signed } });
    }
    return Response.redirect(signed, 302);
  },
};

export async function onRequest({ request }) {
  try {
    // const filePaths = getFiles(new URL('/src', request.url));
    const filePaths = ['/src/1_1_DoubleDots.js', '1_2_AttrCustom.js'];
    const fileTexts = filePaths.map(async path =>
      await (await fetch(new Request(new URL(path, request.url)))).text());
    await Promise.all(fileTexts);
    const res = fileTexts.join('\n\n');
    return new Response(res, {
      headers: {
        'Content-Type': 'application/javascript;charset=UTF-8',
      }
    });
  } catch (e) {
    return new Response('Error making a framework file', { status: 500 });
  }
}


async function getFiles(url) {
  const html = await (await fetch(url)).text();
  const fileNames = [];
  for (let match; match = /<a href="([^"]+)">/g.exec(html);)
    fileNames.push(match[1]);

  console.log("santa", fileNames.length);
  return fileNames.map(path => new URL(path, url.href));
}

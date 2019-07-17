import fetch from 'node-fetch';

(async () => {

  const args = process.argv.slice(2);
  const username = args[0];
  const targetGist = args[1];
  if (!args.length || !username || !targetGist) {
    console.error(`HELP: ${process.argv[1].split('/').pop()} github_username target_gist_id`);
    return;
  }

  const token = process.env.GH_TOKEN;
  if (!token) {
    console.error('Provide GH_TOKEN environment variable!');
    return;
  }

  const gists = (
    await fetch(`https://api.github.com/users/${username}/gists`).then((res) => res.json())
  ).filter((gist) => gist.description);

  const items = await Promise.all(
    gists.map((gist, index) => {

      const created = new Date(gist.created_at).toLocaleDateString();
      const updated = new Date(gist.updated_at).toLocaleDateString();
      return fetch(`https://gist.github.com/${username}/${gist.id}/stargazers`)
        .then((res) => res.text())
        .then((text) => parseInt(text.match(/(\d+) users? starred this/)[1]))
        .then((starsCount) =>
          `  ${index}. [${gist.description}](${gist.html_url}) ★${starsCount} <sub>${created}</sub>`,
        );
    })
  );

  const gistList = items.join('\n');

  const toBase64 = (str) => new Buffer(str).toString('base64');

  try {
    await fetch(`https://api.github.com/gists/${targetGist}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Basic ${toBase64(username + ':' + token)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'z_My Gists.md': {
            content: gistList,
          }
        }
      })
    });
  } catch(e) {
    console.error(e);
    process.exit(1);
  }

  console.log('Done.');


})();

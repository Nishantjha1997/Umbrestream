// Route params arrive as strings. Does AniList's $id: Int accept "21"?
const query = `query ($id: Int) { Media(id: $id, type: ANIME) { id title { romaji } } }`;

for (const id of [21, "21"]) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { id } }),
  });
  const json = await res.json();
  const label = `${typeof id} ${JSON.stringify(id)}`;
  if (json.errors) {
    console.log(`${label}  -> ERROR: ${json.errors[0].message}`);
  } else {
    console.log(`${label}  -> OK: ${json.data?.Media?.title?.romaji ?? "null Media"}`);
  }
}

// Ad-hoc connectivity check for the AniList GraphQL API.
// Verifies the endpoint responds and returns the fields the app queries.
const query = `
  query {
    Page(page: 1, perPage: 3) {
      pageInfo { total currentPage hasNextPage }
      media(type: ANIME, sort: [TRENDING_DESC], isAdult: false) {
        id
        title { romaji english native }
        coverImage { extraLarge large color }
        format
        episodes
        averageScore
        seasonYear
      }
    }
  }
`;

const res = await fetch("https://graphql.anilist.co", {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ query }),
});

const json = await res.json();

if (!res.ok || json.errors) {
  console.log(`FAILED status=${res.status}`);
  console.log(JSON.stringify(json.errors ?? json, null, 2));
  process.exit(1);
}

const page = json.data.Page;
console.log(`OK status=${res.status} total=${page.pageInfo.total}`);
for (const m of page.media) {
  const title = m.title.english ?? m.title.romaji ?? m.title.native;
  console.log(
    `  #${m.id} "${title}" format=${m.format} eps=${m.episodes} score=${m.averageScore} year=${m.seasonYear} cover=${m.coverImage.extraLarge ? "yes" : "no"}`,
  );
}

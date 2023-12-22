const { default: got } = require("got");
const parse_link_header_1 = require("parse-link-header");
// import * as core from '@actions/core';


const TOKEN = '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';

function rand(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function wait(time) {
    return new Promise((resolve) => {
        const tid = setTimeout(() => {
            resolve();
            clearTimeout(tid);
        }, time);
    });
}

const DEFAULT_OPTIONS = {
    prefixUrl: 'https://api.github.com',
    responseType: 'json',
    hooks: {
        beforeRequest: [
            async () => {
                // reduce rate limits
                await wait(rand(10, 25));
            },
        ],
    },
    // headers: {
    //     // Authorization: `token ${core.getInput('api-token', { required: true })}`,
    //     Authorization: `Bearer ${TOKEN}`,
    //     Accept: 'application/vnd.github.star+json',
    // },
};

const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github.star+json',
};
var gotDefault = got.extend(DEFAULT_OPTIONS);

console.log(gotDefault.defaults.options);

function getNextPage({ next, last }) {
    if (!next?.page || !last?.page)
        return null;
    if (next.page === last.page)
        return null;
    return next.page;
}
async function* paginsteStars(url) {
    let nextPage = '1';
    while (nextPage) {
        try {
            const { headers, body } = await gotDefault.get(url, {
                searchParams: {
                    per_page: 100,
                    page: nextPage,
                },
            });
            for (const record of body) {
                yield record;
            }
            const links = (0, parse_link_header_1)(headers.link);
            if (!links)
                return; // exit if no page
            nextPage = getNextPage(links);
        }
        catch (e) {
            console.error('[http-error]:', e.response?.body || e);
            break;
        }
    }
}

function transform(star) {
    return {
        id: star.id,
        node_id: star.node_id,
        name: star.name,
        full_name: star.full_name,
        starred_at: star.starred_at,
        owner: {
            login: star?.owner?.login,
            id: star?.owner?.id,
            avatar_url: star?.owner?.avatar_url,
            url: star?.owner?.url,
            html_url: star?.owner?.html_url,
        },
        html_url: star.html_url,
        description: star.description,
        url: star.url,
        languages_url: star.languages_url,
        created_at: star.created_at,
        updated_at: star.updated_at,
        git_url: star.git_url,
        ssh_url: star.ssh_url,
        clone_url: star.clone_url,
        homepage: star.homepage,
        stargazers_count: star.stargazers_count,
        watchers_count: star.watchers_count,
        language: star.language,
        topics: star.topics,
    };
}

async function main() {
    const data = [];
    for await (const star of paginsteStars('https://api.github.com/user/starred')) {
        data.push(star);
    }

    console.log(data.reduce((acc, val) => {
        const language = val.language || 'miscellaneous';
        acc[language] ||= [];
        acc[language].push(transform(val));
        return acc;
    }, {}));
}

main();

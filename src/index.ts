import * as core from '@actions/core';
import { readdir, readFile } from 'fs/promises';
import ghStarFetch from 'gh-star-fetch';

import {
  renderer,
  REPO_USERNAME,
  generateMd,
  pushNewFiles,
  MARKDOWN_FILENAME,
} from './helpers';
import MD_TEMPLATE from './template';

export async function main() {
  // set default template
  let template = MD_TEMPLATE;

  // get template if found in the repo
  const customTemplatePath = core.getInput('template-path');
  core.info(`check if customTemplatePath: ${customTemplatePath} exists`);
  try {
    template = await readFile(customTemplatePath, 'utf8');
  } catch {
    core.info("Couldn't find template file, using default");
  }

  const sortedByLanguages = await ghStarFetch({
    accessToken: core.getInput('api-token', { required: true }),
    compactByLanguage: true,
  });

  const rendered = await renderer(
    {
      username: REPO_USERNAME,
      stars: Object.entries(sortedByLanguages),
      updatedAt: Date.now(),
    },
    template
  );

  const markdown: string = await generateMd(rendered);

  await pushNewFiles([
    {
      filename: MARKDOWN_FILENAME,
      data: markdown,
    },
    {
      filename: 'data.json',
      data: JSON.stringify(sortedByLanguages, null, 2),
    },
  ]);
}

export async function run(): Promise<any> {
  try {
    await main();
  } catch (error) {
    core.setFailed(`#run: ${error}`);
  }
}

const catchAll = (info: any) => {
  core.setFailed(`#catchAll: ${info}`);
  core.error(info);
};
process.on('unhandledRejection', catchAll);
process.on('uncaughtException', catchAll);

run().catch(core.error);

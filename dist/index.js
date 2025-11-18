"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var github = __toESM(require("@actions/github"));
function getGithubToken() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error(
      "GitHub token is required but not found. Please set either GITHUB_TOKEN or GH_TOKEN environment variable."
    );
  }
  return token;
}
async function run() {
  const { repo } = github.context;
  const token = getGithubToken();
  const octokit = github.getOctokit(token);
  console.log(`Getting open pull requests with base branch: ${github.context.ref}`);
  const openPullRequests = await octokit.rest.pulls.list({
    ...repo,
    base: github.context.ref,
    state: "open",
    draft: false
  });
  if (!openPullRequests.data.length) {
    console.log("No open pull requests found.");
    return;
  }
  console.log(`Found ${openPullRequests.data.length} open pull request(s).`);
  const autoMergePullRequests = openPullRequests.data.filter((pr) => pr.auto_merge !== null);
  if (!autoMergePullRequests.length) {
    console.log("No pull requests with auto-merge enabled found.");
    return;
  }
  console.log(`Found ${autoMergePullRequests.length} pull request(s) with auto-merge enabled.`);
  console.log("Starting to rebase pull requests...");
  for (const pr of autoMergePullRequests) {
    console.log(`Rebasing pull-request #${pr.number}: ${pr.title}`);
    await octokit.rest.pulls.updateBranch({
      ...repo,
      rebase: true,
      pull_number: pr.number
    });
    console.log(`Creating comment on pull-request #${pr.number}`);
    await octokit.rest.issues.createComment({
      ...repo,
      issue_number: pr.number,
      body: "This pull-request has been automatically rebased because it was out of date with the base branch and had auto-merge enabled."
    });
    console.log(`Pull-request #${pr.number} rebased successfully.`);
  }
}
run();

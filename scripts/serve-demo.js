#!/usr/bin/env node
import { startFixtureServer } from '../test/fixtures/server.js';

const DEFAULT_PORT = 8081;

const port = Number(process.argv[2] ?? DEFAULT_PORT);
const server = await startFixtureServer({ port });
process.stdout.write(`Pages de démonstration : ${server.url}/healthy/home.html et ${server.url}/faulty/img-no-alt.html (Ctrl+C pour arrêter)\n`);

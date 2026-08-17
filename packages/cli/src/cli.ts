#!/usr/bin/env node
import process from "node:process";
import { program, command, flag, arg } from "commandstruct";
import { runInit } from "./commands/init.js";
import { runCheck } from "./commands/check.js";
import { runResolve } from "./commands/resolve.js";

const initCmd = command("init")
  .describe("Initialize Platformize configuration in project")
  .flags({
    preset: flag("Target platform preset (e.g. tauri)").optionalParam("string", "tauri"),
    platform: flag("Target platform (e.g. macos)").optionalParam("string", "macos"),
  })
  .action((ctx) => {
    runInit({
      preset: ctx.flags.preset,
      platform: ctx.flags.platform,
    });
  });

const checkCmd = command("check")
  .describe("Check platform resolution for project files")
  .flags({
    platform: flag("Target platform (e.g. macos)").optionalParam("string", "macos"),
    preset: flag("Target platform preset (e.g. tauri)").optionalParam("string", "tauri"),
    dir: flag("Source directory to scan").optionalParam("string", "src"),
  })
  .action((ctx) => {
    runCheck({
      platform: ctx.flags.platform,
      preset: ctx.flags.preset,
      dir: ctx.flags.dir,
    });
  });

const resolveCmd = command("resolve")
  .describe("Resolve a specifier for a given platform")
  .args({
    specifier: arg(),
  })
  .flags({
    platform: flag("Target platform (e.g. macos)").optionalParam("string", "macos"),
    preset: flag("Target platform preset (e.g. tauri)").optionalParam("string", "tauri"),
  })
  .action((ctx) => {
    const result = runResolve({
      specifier: ctx.args.specifier,
      platform: ctx.flags.platform,
      preset: ctx.flags.preset,
    });
    if (result) {
      console.log(result);
    } else {
      console.error(`Could not resolve ${ctx.args.specifier} for platform ${ctx.flags.platform || "macos"}`);
      process.exit(1);
    }
  });

const cli = program("platformize")
  .version("0.1.0")
  .describe("Platform-aware module resolution system CLI")
  .commands(initCmd, checkCmd, resolveCmd)
  .build();

cli.run();

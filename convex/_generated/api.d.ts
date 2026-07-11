/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as authTokens from "../authTokens.js";
import type * as files from "../files.js";
import type * as participants from "../participants.js";
import type * as scoreboard from "../scoreboard.js";
import type * as scoring from "../scoring.js";
import type * as settings from "../settings.js";
import type * as teams from "../teams.js";
import type * as trackerAdmin from "../trackerAdmin.js";
import type * as viewer from "../viewer.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  authTokens: typeof authTokens;
  files: typeof files;
  participants: typeof participants;
  scoreboard: typeof scoreboard;
  scoring: typeof scoring;
  settings: typeof settings;
  teams: typeof teams;
  trackerAdmin: typeof trackerAdmin;
  viewer: typeof viewer;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

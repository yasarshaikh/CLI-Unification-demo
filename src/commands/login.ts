/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { URL } from 'url';
import { Flags, Command } from '@oclif/core';
import { AnyJson } from '@salesforce/ts-types';

import Aliases from '../configs/aliases';
import Enviornments from '../configs/environments';
import Accounts from '../configs/account';

export default class Login extends Command {
  public static description = `login to a Salesforce account or enviornment

  Login to https://login.salesforce.com in a browser. To login to different providers (Salesforce org, heroku, commerce cloud, mulesoft, etc) sepecify the domain or login url of the service. For example, '--instance-url=heroku.com'. 
  `;

  public static examples = [
    'sf login --instance-url https://<mydomain>.my.salesforce.com',
    'sf login --instance-url heroku.com',
  ];

  public static flags = {
    alias: Flags.string({
      description: 'set an alias for the environment - see all aliases using `sf env alias list`',
    }),
    browser: Flags.string({
      description: 'browser to open SSO with (example: "firefox", "safari")',
    }),
    'client-id': Flags.string({
      char: 'i',
      description: 'OAuth client ID (sometimes called the consumer key)',
    }),
    'expires-in': Flags.integer({
      description: 'duration of token in seconds if supported by the auth provider (default 1 year)',
    }),
    'login-url': Flags.string({
      char: 'r',
      description: 'the login url of the auth provider',
      default: 'https://login.salesforce.com',
    }),
  };

  public async run(): Promise<AnyJson> {
    const { flags, args } = await this.parse(Login);

    const browser = flags.browser || 'browser';
    const loginUrl = flags['login-url'].startsWith('http') ? flags['login-url'] : `https://${flags['login-url']}`;

    if (!loginUrl.endsWith('salesforce.com') && !loginUrl.endsWith('heroku.com')) {
      throw new Error('Salesforce CLI only supports logging into salesforce.com and heroku.com');
    }

    this.log(`Opening ${browser} at ${loginUrl}...\n`);

    const accounts = await Accounts.create({});
    const env = await Enviornments.create({});

    const domain = new URL(loginUrl).host;
    let user = `myuser-${domain}@mycompany.com`;

    // If this is the second time running login an an org, regerster it as a sandbox
    if (env.get(user) || domain.includes('test')) {
      user += '.sandbox';
    }

    let status = `Logged in as ${user}`;
    if (flags.alias) {
      status += `\n   with alias ${flags.alias}`;
      const aliases = await Aliases.create({});
      aliases.set(flags.alias, user);
      await aliases.write();
    }
    if (flags['client-id']) {
      status += `\n   with connected app ${flags['client-id']}`;
    }
    if (flags['expires-in']) {
      if (domain.includes('heroku')) {
        status += `\n   and expires in ${flags['expires-in']}`;
      } else {
        this.warn(`Can not set token experation date for ${domain}`);
      }
    }
    this.log(status);

    if (domain.includes('heroku')) {
      accounts.set('heroku', {
        user,
        expires: flags['expires-in'],
        // Set remote environments not connected too.
        environments: [
          'heroku-app-1',
          'heroku-app-2',
          'heroku-app-3',
          'functions-env-1',
          'functions-env-2',
          'functions-env-3',
        ],
      });
    } else {
      const hub = accounts.get('hub');

      if (!hub && !user.includes('sandbox')) {
        // Set remote environments not connected too.
        accounts.set('hub', {
          user,
          environments: [
            `${user}.scratch1`,
            `${user}.scratch2`,
            `${user}.scratch3`,
            `${user.replace('login', 'test')}.sandbox`,
          ],
        });
      }

      // A heroku account doesn't show up as an enviornment, so only do for orgs.
      env.set(user, {
        connected: true,
        status: 'Connected',
        type: 'org',
        // You could imagine a post auth step to get this sort of information from the enviornment.
        context: !user.includes('sandbox') ? 'hub' : 'sandbox',
      });
      await env.write();
    }
    await accounts.write();

    return { flags, args, domain, user };
  }
}

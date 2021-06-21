/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import SfCommand from '../../../sf-command';

export default class EnvVarList extends SfCommand {
  public static description = 'Lists environment variables from a remote environment';

  public static examples = ['sf env var list'];

  public async run(): Promise<void> {
    this.log('Listing env vars...');
  }
}

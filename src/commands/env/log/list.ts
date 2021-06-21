/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import SfCommand from '../../../sf-command';

export default class EnvLogList extends SfCommand {
  public static description = 'List env logs';

  public static examples = ['sf env log list'];

  public async run(): Promise<void> {
    this.log('Listing env logs...');
  }
}

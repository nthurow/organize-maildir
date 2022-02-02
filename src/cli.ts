import {command} from 'yargs';

import {main} from './';

const args = command(
  'Organize Maildir',
  'Rename maildir files such that the filename includes to, from, date, and subject'
)
  .options({
    maildir: {describe: 'Path to the directory containing the maildir files', demandOption: true, type: 'string'},
    outdir: {describe: 'Path to the directory where renamed files should be placed', demandOption: true, type: 'string'}
  })
  .help()
  .parseSync();

main(args.maildir, args.outdir);

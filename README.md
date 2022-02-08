# organize-maildir

Copy emails in a maildir directory into a new folder organized by year

## Why

Sometimes you may want to backup your emails using a tool such as [getmail](https://wiki.archlinux.org/title/Getmail). However, these tools will simply download your raw emails into one directory with incomprehensible names. `organize-maildir` will help you copy these files out of your maildir folder and into a folder of your choice, where they will be organized by year and renamed to reflect the metadata of the email.

## Installation and Usage

Using [`yarn dlx`](https://yarnpkg.com/cli/dlx):

```
$ yarn dlx @nthurow/organize-maildir
```

Using [`npx`](https://docs.npmjs.com/cli/v8/commands/npx):

```
$ npx @nthurow/organize-maildir
```

When executed using the above commands, `organize-maildir` will begin reading all files in the input directory and will copy them to the output directory, where they will be placed into subfolders reflecting the year the email was sent or received.

### Arguments

- `--maildir`: the directory containing the maildir files, such as `~/email/backups/new`
- `--outdir`: the directory where the email files should be copied. They will be copied into subdirectories named after the year that the email was received. For example, if you use an outdir of `~/email/backups/sorted`, then emails will be copied into `~/emails/backups/sorted/2018`, `~/emails/backups/sorted/2019`, etc. Additionally, the filenames will be changed to reflect the email metadata. Filenames will use the pattern:

  ```
  <date and time>---from:<sender>---to:<recipient>---subject:<subject>
  ```

## Future Enhancements

- allow filtering of emails in input directory (for example, only process emails sent/received during the given time period, or from a certain person)
- customize how the output directory is organized (for example, organize by year and month, or by sender)
- customize the output filename

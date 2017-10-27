import path = require('path')
import symlinkDir from 'symlink-dir'
import writeJsonFile = require('write-json-file')
import getPreviewDir from './getPreviewDir'
import pnpmExec from './pnpmExec'
import publishToDir from './publishToDir'

export default async function (what: string, where: string) {
  const pkgDir = path.resolve(what)
where = path.resolve(where)

  const previewDir = await getPreviewDir(where, path.basename(pkgDir))
  const distDir = path.join(previewDir, 'package')

  await publishToDir(pkgDir, distDir)

  const pkg = require(path.join(distDir, 'package.json'))
  const wrapperPkg = {
    dependencies: pkg.peerDependencies || {},
  }

  // Would be better to install the package dirrectly from the tarball
  // in that case this hack would not be needed
  if (pkg.scripts) {
    delete pkg.scripts.prepare
    delete pkg.scripts.prepublish
  }

  await writeJsonFile(path.join(distDir, 'package.json'), pkg)

  await writeJsonFile(path.join(previewDir, 'package.json'), wrapperPkg)

  await pnpmExec({
    args: ['install', '--production'],
    prefix: previewDir,
  })

  await pnpmExec({
    args: ['link', '--production'],
    prefix: distDir,
  })

  await pnpmExec({
    args: ['link', pkg.name],
    prefix: where,
  })
}

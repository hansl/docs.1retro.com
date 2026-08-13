# 1Retro Documentation

Source for [docs.1retro.com](https://docs.1retro.com): 1Retro's specifications and product documentation, in one place.

This is an open repository. Specs and guides are written in Markdown so anyone can read them on GitHub or propose a
change without running the full site.

## What lives here

- **Specifications**: the formats and protocols behind 1Retro, written to be implemented by anyone. The first is the
  Universal Saves Format (`.1saves` / `1SAV`); the 1Forge save-parser system and others follow.
- **Guides & product docs**: how to use 1Retro across platforms (web, desktop, CLI, MiSTer, OnionOS, and friends).

Content lives under `src/content/docs/`, split into `specifications/` and `guides/`. The sidebar is generated from those
directories, so adding a page is just adding a Markdown file.

## Local development

The site is built with [Astro Starlight](https://starlight.astro.build). You need a current Node.js LTS (20 or 22).

Install dependencies:

```sh
npm install
```

Start the dev server on [localhost:4321](http://localhost:4321), with live reload:

```sh
npm start
```

Build the static site into `./dist`:

```sh
npm run build
```

Preview the production build locally before deploying:

```sh
npm run preview
```

Run the tests for the Universal Saves Format schema:

```sh
npm test
```

They cover the encoding rules the format's layout depends on, and check that the CDDL schema accepts the bundles it
should and rejects the ones it should not. The encoding tests need nothing but Node. The schema tests need the RFC 8610
reference tool and skip themselves when it is missing, so install it with `gem install cddl` to run them.

You do not need any of this to edit prose. Markdown changes can be made and reviewed directly on GitHub.

## Deployment

The site is served as a static build on
[DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/) at
[docs.1retro.com](https://docs.1retro.com).

Pushes to `main` deploy automatically. App Platform runs `npm run build` with the Node.js buildpack and publishes
`./dist`. Because `prebuild` runs `npm run lint`, a Markdown lint failure or a broken internal link fails the deploy
rather than shipping.

The app configuration lives in [`.do/app.yaml`](./.do/app.yaml) and is the source of truth. After editing it, apply the
change with:

```sh
doctl apps update <app-id> --spec .do/app.yaml
```

## Contributing

Changes are welcome, from typo fixes to whole new specs. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to propose a
change and the sign-off we ask for on commits. See [STYLE.md](./STYLE.md) for how we write here, including the
one-sentence-per-line rule.

## License

This repository is dual-licensed:

- **Documentation content** (prose, specs, images) under [CC BY 4.0](./LICENSE-CONTENT).
- **Code samples and snippets** under the [MIT License](./LICENSE-CODE).

By contributing, you agree your contributions are released under these terms.

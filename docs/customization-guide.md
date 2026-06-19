# Customization Guide

## Character

Update `src/config.ts` to replace Otto with another IP:

- name
- avatar
- description
- scenes
- catchphrases

## Theme

Edit CSS variables in `src/styles/globals.css`:

- `--cream`
- `--paper`
- `--milk`
- `--pink`
- `--sage`
- `--yellow`
- `--cocoa`

## Platforms

Edit `platforms`, `contentTypes`, and `styles` in `src/config.ts`.

## AI

The MVP stores AI settings locally. A production deployment should proxy API calls through a trusted server if you do not want users to manage their own keys.

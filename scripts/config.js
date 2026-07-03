'use strict';
/* config.js — single source for the deployed origin used in absolute URLs
   (Open Graph / Twitter social images). Everything else on the site uses
   relative paths and needs no domain. Override at build time:

     SITE_URL=https://breakouts.yourdistrict.org node scripts/gen-site.js
     SITE_URL=https://breakouts.yourdistrict.org node scripts/gen-html.js

   The default matches the nginx `server_name` placeholder. */
module.exports = {
  SITE_URL: (process.env.SITE_URL || 'https://breakouts.example.org').replace(/\/+$/, ''),
};

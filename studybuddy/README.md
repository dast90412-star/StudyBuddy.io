# GitHub Pages Custom Domain DNS Instructions

This repository uses GitHub Pages. To enable the custom domain `studybuddy.com.in` and pass GitHub's DNS check, you must configure DNS records at your domain registrar/DNS provider.

Required records for an apex domain (studybuddy.com.in):

- Add four A records pointing to GitHub Pages IPs:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`

Optional (recommended):

- Add a CNAME for the `www` subdomain pointing to your GitHub Pages domain (replace `USERNAME` with your GitHub username):
  - `www` CNAME -> `dast90412-star.github.io`  

Notes:

- GitHub requires either A records for the apex domain (as above) or an ALIAS/ANAME that points to `USERNAME.github.io` if your DNS provider supports it.
- After updating DNS, propagation can take up to 48 hours, but usually completes within a few minutes to a few hours.
- Once DNS is configured correctly, return to your repository's Pages settings and click "Check again". The "Enforce HTTPS" option will become available once GitHub has issued a certificate.

How to verify from Windows PowerShell:

Run these commands (replace `studybuddy.com.in` if needed):

```powershell
Resolve-DnsName studybuddy.com.in -Type A
Resolve-DnsName www.studybuddy.com.in -Type CNAME
```

If you prefer `nslookup`:

```powershell
nslookup studybuddy.com.in
nslookup www.studybuddy.com.in
```

If the A records point to the four GitHub IPs above and (optionally) the `www` CNAME points to `dast90412-star.github.io`, the GitHub Pages DNS check should pass.

If you need, I can generate a step-by-step screenshot guide for common registrars (GoDaddy, Namecheap, Cloudflare). Provide your registrar name if you'd like that.

Run the included DNS check (Windows PowerShell):

```powershell
# from repository root
.\check-dns.ps1 -Domain studybuddy.com.in
```

The script will report whether the apex A records match GitHub Pages IPs and whether a `www` CNAME exists.

# DNS Troubleshooting (GitHub Pages custom domain)

Common issues and fixes when GitHub's Pages DNS check fails.

1) Apex CNAME vs A records
- The apex (root) domain (example.com) cannot have a CNAME record on most DNS providers. GitHub requires either:
  - Four A records pointing to GitHub Pages IPs (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153), OR
  - An ALIAS/ANAME record that points to `USERNAME.github.io` (if your DNS provider supports it).

2) Cloudflare proxying (common cause)
- If you use Cloudflare, make sure the DNS records for your domain are set to "DNS only" (the orange cloud must be gray). Cloudflare's proxy hides the real IPs and will cause the check to fail.

3) Conflicting records
- Remove any conflicting records for the same name (for example, don't have both an A record and a CNAME for the same host). The apex must use A/ALIAS/ANAME records.

4) Typos and whitespace
- Ensure the exact domain is entered in the repository `CNAME` file (no extra newline characters beyond a single line with the domain), and that the domain in the Pages settings matches.

5) Propagation time
- DNS changes can take time. Use `Resolve-DnsName` or `nslookup` to confirm change propagated before retrying GitHub's "Check again".

6) Example quick checks (PowerShell)

```powershell
Resolve-DnsName studybuddy.com.in -Type A
Resolve-DnsName www.studybuddy.com.in -Type CNAME
```

7) If you still see "DNS check unsuccessful"
- Verify your registrar shows the records you added and that there is no DNSSEC misconfiguration preventing lookups.
- Temporarily disable any CDN/proxying and re-run the GitHub Pages check.

If you tell me your registrar (Namecheap, GoDaddy, Cloudflare, etc.) I can give step-by-step UI instructions.

import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get("url")

    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 })

    try {
        const decoded = decodeURIComponent(url)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        const res = await fetch(decoded, {
            signal: controller.signal,
            headers: { "User-Agent": "ConnectUpBot/1.0" }
        })
        clearTimeout(timeout)

        const html = await res.text()

        const getMetaContent = (regexes: RegExp[]) => {
            for (const regex of regexes) {
                const match = html.match(regex)
                if (match?.[1]) return match[1].trim()
            }
            return null
        }

        const title = getMetaContent([
            /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
            /<title[^>]*>([^<]+)<\/title>/i,
        ])

        const description = getMetaContent([
            /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
        ])

        const image = getMetaContent([
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
        ])

        const siteName = getMetaContent([
            /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
        ])

        return NextResponse.json({
            url: decoded,
            title: title || decoded,
            description: description || "",
            image: image || null,
            siteName: siteName || new URL(decoded).hostname
        })
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch preview" }, { status: 500 })
    }
}

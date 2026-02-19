import { parseFile, selectCover } from "music-metadata";

export interface MediaMetadata {
    artwork?: string;
    title?: string;
    artist?: string;
}

export async function parseMediaMetadata(fsPath: string): Promise<MediaMetadata> {
    const name = fsPath.split(/[/\\]/).pop() ?? fsPath;
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    const audioExts = ["mp3", "flac", "ogg", "aac", "m4a", "wav"];

    let artwork: string | undefined;
    let title: string | undefined;
    let artist: string | undefined;

    if (audioExts.includes(ext)) {
        try {
            const meta = await parseFile(fsPath, { skipCovers: false });

            title = meta.common.title;
            artist = meta.common.artist;

            const pic = selectCover(meta.common.picture ?? []);
            if (pic) {
                const b64 = Buffer.from(pic.data).toString("base64");
                artwork = `data:${pic.format};base64,${b64}`;
            }
        } catch {
            // No metadata or unreadable — silently skip
        }
    }

    return { artwork, title, artist };
}

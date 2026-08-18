import crypto from 'crypto';
import { mentionRawDataSchemaType } from '../schemas/dataSchema';


const computeDedupHash = (normalizedContent: string, url: string | null) => {
    const cleanUrl = url ? url.split('?')[0].toLowerCase().trim() : '';
    const cleanContent = normalizedContent.toLowerCase().replace(/\s+/g, ' ').trim();
    const rawFingerprint = `${cleanUrl}|${cleanContent}`;
    return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
}


const normalizeSource = (source: string) => {
    if (!source) return 'unknown';
    const clean = source.trim().toLowerCase();
    if (clean === 'thestar' || clean === 'the star') return 'the star';
    if (clean === 'twitter' || clean === 'x') return 'twitter';
    return clean;
}

export type normalizeItemData = mentionRawDataSchemaType & {
    source_normalized: string
    dedup_hash: string
}

export const normalizeMention = (raw: mentionRawDataSchemaType): normalizeItemData => {
    const sourceNorm = normalizeSource(raw.source);
    const dedupHash = computeDedupHash(raw.content, raw.url);

    return {
        external_id: raw.external_id,
        source: raw.source.trim(),
        source_normalized: sourceNorm,
        title: raw.title,
        content: raw.content,
        url: raw.url,
        author: raw.author ? raw.author.trim() : null,
        published_at: raw.published_at,
        engagement: raw.engagement,
        dedup_hash: dedupHash,
    };
}

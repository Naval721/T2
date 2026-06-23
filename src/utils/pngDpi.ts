const makeCRCTable = () => {
    let c;
    const crcTable: number[] = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
};

const crcTable = makeCRCTable();

const calculateCRC = (data: Uint8Array): number => {
    let crc = 0 ^ (-1);
    for (let i = 0; i < data.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
};

/**
 * Inserts or replaces the pHYs chunk in a PNG blob to set its target DPI.
 * This ensures professional print software (like Photoshop) opens the image
 * at the correct real-world dimensions and DPI.
 */
export const setPngDpi = async (blob: Blob, dpi: number): Promise<Blob> => {
    try {
        const arrayBuffer = await blob.arrayBuffer();
        const view = new DataView(arrayBuffer);
        const originalBytes = new Uint8Array(arrayBuffer);

        // Verify PNG signature (first 4 bytes: 89 50 4E 47)
        if (originalBytes[0] !== 0x89 || originalBytes[1] !== 0x50 || originalBytes[2] !== 0x4E || originalBytes[3] !== 0x47) {
            return blob; // Not a PNG, return untouched
        }

        // Calculate pixels per meter
        const pixelsPerMeter = Math.round(dpi * 39.37007874);

        // Construct pHYs chunk
        const physChunk = new Uint8Array(21);
        const physView = new DataView(physChunk.buffer);
        physView.setUint32(0, 9); // Data length (9 bytes)
        
        // Chunk type "pHYs"
        physChunk[4] = 112; // p
        physChunk[5] = 72;  // H
        physChunk[6] = 89;  // y
        physChunk[7] = 115; // s
        
        physView.setUint32(8, pixelsPerMeter);  // X pixels per unit
        physView.setUint32(12, pixelsPerMeter); // Y pixels per unit
        physChunk[16] = 1;                     // Unit: 1 = meter

        // Calculate CRC32 of chunk type & chunk data (13 bytes total)
        const crc = calculateCRC(physChunk.subarray(4, 17));
        physView.setUint32(17, crc);

        const chunks: Uint8Array[] = [];
        chunks.push(originalBytes.subarray(0, 8)); // PNG Signature

        let pos = 8;
        let inserted = false;

        while (pos < originalBytes.length) {
            if (pos + 8 > originalBytes.length) break;
            const length = view.getUint32(pos);
            const typeBytes = originalBytes.subarray(pos + 4, pos + 8);
            const type = String.fromCharCode(...typeBytes);

            const chunkTotalLength = 4 + 4 + length + 4; // length + type + data + crc
            if (pos + chunkTotalLength > originalBytes.length) break;

            if (type === 'pHYs') {
                // Strip existing pHYs chunk
                pos += chunkTotalLength;
                continue;
            }

            chunks.push(originalBytes.subarray(pos, pos + chunkTotalLength));

            // Insert our pHYs chunk right after the IHDR chunk
            if (type === 'IHDR' && !inserted) {
                chunks.push(physChunk);
                inserted = true;
            }

            pos += chunkTotalLength;
        }

        if (!inserted) {
            // Fallback insertion
            chunks.splice(1, 0, physChunk);
        }

        // Combine chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const newBytes = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            newBytes.set(chunk, offset);
            offset += chunk.length;
        }

        return new Blob([newBytes], { type: 'image/png' });
    } catch (e) {
        console.error("Failed to inject PNG DPI metadata:", e);
        return blob; // Fallback to raw blob on failure
    }
};

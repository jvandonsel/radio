
import { Band } from "./band-selector";


export function getUrls(band: Band) {
    if (band == Band.A) {
        return bbc_urls;
    } else if (band == Band.B) {
        return cbc_urls;
    } else if (band == Band.C) {
        //TODO
        return [];
    } else {
        return [];
    }
}

export const bbc_urls = [
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_one.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_1xtra.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_one_dance.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_one_relax.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_two.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_three.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_fourfm.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_four_extra.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_five_live.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_6music.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_world_service.m3u8"
];

export const cbc_urls = [
    // Taken from https://gist.github.com/nevillepark/d8358256e05a23250ad845a70776776e

    // CBC Music (Eastern)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r2_tor",

    // CBC Music (Eastern)
    "https://cbcradiolive.akamaized.net/hls/live/2041057/ES_R2ETR/master.m3u8",

    // CBC Radio 1 (NB/Saint John)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_snb",

    // CBC Radio 1 (BC/Vancouver)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_vcr",

    // CBC Radio 1 (ON/Toronto)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_tor",

    // CBC Radio 1 (QC/Montréal)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_mtl",

    // CBC Radio 1 (NS/Halifax)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_hfx",

    // Ici Musique (Montréal, Toronto, Windsor)
    "https://rcavliveaudio.akamaized.net/hls/live/2006979/M-7QMTL0_MTL/master.m3u8"
];


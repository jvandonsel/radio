/**
 * Radio URLs for all 3 bands.
 */
import { Band } from "./band-selector";


/**
 * Given a band, return the list of URLs for that band.
 */
export function getUrls(band: Band): string[] {
    if (band == Band.A) {
        return bbc_urls;
    } else if (band == Band.B) {
        return cbc_urls;
    } else if (band == Band.C) {
        return us_urls;
    } else {
        return [];
    }
}

const bbc_urls = [
    // Radio 1
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_one.m3u8",
    // Radio 1 extra
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_1xtra.m3u8",
    // Radio 1 dance
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_one_dance.m3u8",
    // Radio 1 relax
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_one_relax.m3u8",
    // Radio 2
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_two.m3u8",
    // Radio 3
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_three.m3u8",
    // Radio 4 FM
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_fourfm.m3u8",
    // Radio 4 extra
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_four_extra.m3u8",
    // Radio 6 music
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_6music.m3u8",
    // World Service
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_world_service.m3u8"
];

const cbc_urls = [
    // Taken from https://gist.github.com/nevillepark/d8358256e05a23250ad845a70776776e

    // CBC Music (Eastern)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_tor",

    // CBC Music (Eastern)
    "https://cbcradiolive.akamaized.net/hls/live/2041057/ES_R2ETR/master.m3u8",

    // CBC Radio 1 (NB/Saint John)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_snb",

    // CBC Radio 1 (ON/Toronto)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_tor",

    // CBC Radio 1 (QC/Montréal)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_mtl",

    // CBC Radio 1 (NS/Halifax)
    "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_hfx",

    // Ici Musique (Montréal, Toronto, Windsor)
    "https://rcavliveaudio.akamaized.net/hls/live/2006979/M-7QMTL0_MTL/master.m3u8"
];

const us_urls = [
    // WGBH
    "https://hls.audio.wgbh.org/wgbh_hls/playlist.m3u8",
    // WHYY
    "http://whyy-hd.streamguys1.com/whyy-hd-mp3",
    // WMBR
    "http://wmbr.org:8000/hi",
    // WGVU
    "http://22223.live.streamtheworld.com:80/WGVUFM_SC",
    // KWIT
    "https://playerservices.streamtheworld.com/api/livestream-redirect/KWITFM.mp3",
    // 
    "https://cms.stream.publicradio.org/cms.mp3",
    // Classical Oasis
    "http://66.42.114.24:8000/live",
    // WNED
    "http://22113.live.streamtheworld.com:80/WNEDFM_SC",
    // Jazz24
    "http://live.wostreaming.net/direct/ppm-jazz24mp3-ibc1"
    
];

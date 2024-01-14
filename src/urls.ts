/**
 * Radio URLs for all 3 bands.
 * Useful repository of URLs: https://streamurl.link/
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
    "http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_radio_one/bbc_radio_one.isml/bbc_radio_one-audio%3d96000.norewind.m3u8",
    // Radio 1 extra
    "http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_1xtra/bbc_1xtra.isml/bbc_1xtra-audio%3d96000.norewind.m3u8",
    // Radio 1 dance
    "http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_radio_one_dance/bbc_radio_one_dance.isml/bbc_radio_one_dance-audio%3d96000.norewind.m3u8",
    // Radio 1 relax
    "http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_radio_one_relax/bbc_radio_one_relax.isml/bbc_radio_one_relax-audio%3d96000.norewind.m3u8",
    // Radio 2
    "http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_radio_two/bbc_radio_two.isml/bbc_radio_two-audio%3d96000.norewind.m3u8",
    // Radio 3
    "http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_radio_three/bbc_radio_three.isml/bbc_radio_three-audio%3d96000.norewind.m3u8",
    // Radio 4 FM
    "http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_radio_fourfm/bbc_radio_fourfm.isml/bbc_radio_fourfm-audio%3d96000.norewind.m3u8",
    // Radio 4 extra
    "http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_radio_four_extra/bbc_radio_four_extra.isml/bbc_radio_four_extra-audio%3d96000.norewind.m3u8",
    // Radio 6 music
    "http://as-hls-ww-live.akamaized.net/pool_904/live/ww/bbc_6music/bbc_6music.isml/bbc_6music-audio%3d96000.norewind.m3u8",
    // World Service
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_world_service.m3u8"
];

const cbc_urls = [
    // CBC Radio One Halifax
    "https://playerservices.streamtheworld.com/api/livestream-redirect/CBHA_CBC.mp3",

    // CBC Radio One Edmonton
    "https://playerservices.streamtheworld.com/api/livestream-redirect/CBXAM_CBC.mp3",

    // CBC Music Toronto
    "https://playerservices.streamtheworld.com/api/livestream-redirect/CBLFM_CBC.mp3",

    // CBC Radio One Ottawa
    "https://playerservices.streamtheworld.com/api/livestream-redirect/CBOFM_CBC.mp3",

    // CBC Radio One St. John's
    "https://playerservices.streamtheworld.com/api/livestream-redirect/CBN1_CBC.mp3",

    // CBC Music Halifax
    "https://playerservices.streamtheworld.com/api/livestream-redirect/CBH_CBC.mp3"
        
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

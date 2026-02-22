import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const BASE_URL = 'https://public.api.bsky.app/xrpc';
const BATCH_SIZE = 25;
const DELAY_MS = 500; // be polite to the public API between batches

function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function fetchProfiles(handles) {
  const params = handles.map(h => `actors=${encodeURIComponent(h)}`).join('&');
  const url = `${BASE_URL}/app.bsky.actor.getProfiles?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bluesky API error ${res.status}`);
  const data = await res.json();
  return data.profiles || [];
}

async function upsertCreator(profile) {
  const { data, error } = await supabase
    .from('creators')
    .upsert({
      platform: 'bluesky',
      platform_id: profile.did,
      username: profile.handle,
      display_name: profile.displayName || profile.handle,
      profile_image: profile.avatar || null,
      description: profile.description || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform,platform_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function saveCreatorStats(creatorId, profile) {
  const followers = profile.followersCount ?? 0;
  if (!followers) return; // never write 0 — guard against bad API data

  const today = getTodayLocal();
  const { error } = await supabase
    .from('creator_stats')
    .upsert({
      creator_id: creatorId,
      recorded_at: today,
      subscribers: followers,
      followers: followers,
      total_posts: profile.postsCount ?? 0,
      total_views: null,
    }, { onConflict: 'creator_id,recorded_at' });

  if (error) throw error;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Top 500+ Bluesky handles sourced from vqv.app — ad accounts filtered out
const HANDLES = [
  'aoc.bsky.social',
  'mcuban.bsky.social',
  'markhamillofficial.bsky.social',
  'theonion.com',
  'georgetakei.bsky.social',
  'nytimes.com',
  'stephenking.bsky.social',
  'meidastouch.com',
  'npr.org',
  'atrupar.com',
  'altnps.bsky.social',
  'briantylercohen.bsky.social',
  'gtconway.bsky.social',
  'washingtonpost.com',
  'hankgreen.bsky.social',
  'chrislhayes.bsky.social',
  'rbreich.bsky.social',
  'ronfilipkowski.bsky.social',
  'mollyjongfast.bsky.social',
  'hcrichardson.bsky.social',
  'theguardian.com',
  'petebuttigieg.bsky.social',
  'lincolnproject.us',
  'muellershewrote.com',
  'marcelias.bsky.social',
  'jamellebouie.net',
  'pattonoswalt.bsky.social',
  'acyn.bsky.social',
  'cnn.com',
  'propublica.org',
  'mehdirhasan.bsky.social',
  'barackobama.bsky.social',
  'aaronparnas.bsky.social',
  'jay.bsky.team',
  'dieworkwear.bsky.social',
  'dril.bsky.social',
  'sanders.senate.gov',
  'thedailyshow.com',
  'joycewhitevance.bsky.social',
  'bencollins.bsky.social',
  'jojofromjerz.bsky.social',
  'therickwilson.bsky.social',
  'joncooper-us.bsky.social',
  'weratedogs.com',
  'mmpadellan.bsky.social',
  'governorwalz.mn.gov',
  'katiephang.bsky.social',
  'levarburton.bsky.social',
  'timothysnyder.bsky.social',
  'just-jack-1.bsky.social',
  'xkcd.com',
  'youranoncentral.bsky.social',
  'politico.com',
  'jimacosta.bsky.social',
  'bloomberg.com',
  'karaswisher.bsky.social',
  'alyankovic.bsky.social',
  'calltoactivism.bsky.social',
  'archive.org',
  'anneapplebaum.bsky.social',
  'adamparkhomenko.bsky.social',
  'bodegacats.bsky.social',
  'juddlegum.bsky.social',
  'financialtimes.com',
  'warren.senate.gov',
  'sethabramson.bsky.social',
  'democracydocket.com',
  'jefftiedrich.bsky.social',
  'benstiller.redhour.com',
  'joyannreid.bsky.social',
  'wired.com',
  'kevinmkruse.bsky.social',
  'maryltrump.bsky.social',
  'fpwellman.bsky.social',
  'phillewis.bsky.social',
  'angrystaffer.bsky.social',
  'mrjoncryer.bsky.social',
  'thetnholler.bsky.social',
  'tobyfox.undertale.com',
  'rexchapman.bsky.social',
  'theatlantic.com',
  'mjfree.bsky.social',
  'radiofreetom.bsky.social',
  'kenwhite.bsky.social',
  'minakimes.bsky.social',
  'newyorker.com',
  'scalzi.com',
  'bmeiselas.bsky.social',
  'motherjones.com',
  'barbmcquade.bsky.social',
  'tribelaw.bsky.social',
  'cwebbonline.com',
  'meiselasb.bsky.social',
  'nycsouthpaw.bsky.social',
  'asharangappa.bsky.social',
  'patriottakes.bsky.social',
  'hillaryclinton.bsky.social',
  'avindman.bsky.social',
  'jamesgunn.bsky.social',
  'kumail.bsky.social',
  'mrsbettybowers.bsky.social',
  'tristansnell.bsky.social',
  'dworkin.bsky.social',
  'davidcorn.bsky.social',
  'jenrubin.bsky.social',
  'kylegriffin1.bsky.social',
  'katmabu.bsky.social',
  'shitpostverdade2.bsky.social',
  'flavorflav.bsky.social',
  'weissmann.substack.com',
  'realtexaspaul.com',
  'jimmykimmel.com',
  'ruthbenghiat.bsky.social',
  'politicsgirl.bsky.social',
  'pkrugman.bsky.social',
  'chrisgeidner.bsky.social',
  'neilhimself.neilgaiman.com',
  'junlper.beer',
  'jaketapper.bsky.social',
  'jonbois.bsky.social',
  'reuters.com',
  'catsofyore.bsky.social',
  'internethippo.bsky.social',
  'glennkirschner.bsky.social',
  'realgdt.bsky.social',
  'pfrazee.com',
  'adamserwer.bsky.social',
  'johncusack.bsky.social',
  'davidpakman.bsky.social',
  'emptywheel.bsky.social',
  'apnews.com',
  'harrylitman.bsky.social',
  'rpsagainsttrump.bsky.social',
  'kenklippenstein.bsky.social',
  'lulaoficialbluesky.bsky.social',
  'andyrichter.co',
  'taylorlorenz.bsky.social',
  'kyledcheney.bsky.social',
  'astrokatie.com',
  'natsechobbyist.bsky.social',
  'yasharali.bsky.social',
  'govpritzker.illinois.gov',
  'ocasio-cortez.house.gov',
  'goldengateblond.bsky.social',
  'theverge.com',
  'popbase.tv',
  'neildegrassetyson.com',
  'therealhoarse.bsky.social',
  'thebulwark.com',
  'theliamnissan.bsky.social',
  'roxanegay.bsky.social',
  'malcolmnance.bsky.social',
  'politico.eu',
  'natureneon.bsky.social',
  'therealjackhopkins.bsky.social',
  'bellingcat.com',
  'safety.bsky.app',
  'libradunn1.bsky.social',
  'joshtpm.bsky.social',
  'hakeem-jeffries.bsky.social',
  'erininthemorning.com',
  'sifill.bsky.social',
  'elienyc.bsky.social',
  'nickknudsenus.bsky.social',
  'ngntrtr.bsky.social',
  'raskin.house.gov',
  'maxwellfrost.bsky.social',
  'marawilson.bsky.social',
  'indivisible.org',
  'annabower.bsky.social',
  'hausofdecline.bsky.social',
  'keithedwards.bsky.social',
  'teapainusa.bsky.social',
  'mrjamesob.bsky.social',
  'jasmineforus.bsky.social',
  'gavinnewsom.bsky.social',
  'carlquintanilla.bsky.social',
  'artcandee.bsky.social',
  'stevenbeschloss.bsky.social',
  'governor.ca.gov',
  'dahlialithwick.bsky.social',
  'espn.com',
  'stephencolbert.bsky.social',
  'pixelatedboat.bsky.social',
  'luscas.com.br',
  'morgfair.bsky.social',
  'booker.senate.gov',
  'stevevladeck.bsky.social',
  'caseynewton.bsky.social',
  'donlemonofficial.bsky.social',
  'nothoodlum.bsky.social',
  'piperformissouri.bsky.social',
  'updatecharts.com.br',
  'normeisen.bsky.social',
  'charlotteclymer.bsky.social',
  'bbcnewsnight.bsky.social',
  'culturecrave.co',
  'parkermolloy.com',
  'pbsnews.org',
  'johnpavlovitz.bsky.social',
  'erikahilton.bsky.social',
  'profgalloway.com',
  'molly.wiki',
  'strandjunker.com',
  'fredguttenberg.bsky.social',
  'nytpitchbot.bsky.social',
  'schiff.senate.gov',
  'aaronblack.bsky.social',
  'democracynow.org',
  'frankfigliuzzi.bsky.social',
  'mrrickygervais.bsky.social',
  'lakotaman.bsky.social',
  'carolecadwalla.bsky.social',
  'seriesbrasil.com.br',
  'daveweigel.bsky.social',
  'marisakabas.bsky.social',
  'jayrosen.bsky.social',
  'urocklive1.bsky.social',
  'johnfugelsang.bsky.social',
  'johngreensbluesky.bsky.social',
  'felipeneto.com.br',
  'miafarrow.bsky.social',
  'steampowered.com',
  'realtuckfrumper.bsky.social',
  'schatz.bsky.social',
  'rgoodlaw.bsky.social',
  'edyong209.bsky.social',
  'occupydemocrats.bsky.social',
  'oliviaoftroye.com',
  'leahlitman.bsky.social',
  'ditzkoff.bsky.social',
  'ohnoshetwitnt.bsky.social',
  'benwikler.bsky.social',
  'chrismurphyct.bsky.social',
  'mmfa.bsky.social',
  'elevenfilms.com',
  'grantstern.bsky.social',
  'mayraphotography.bsky.social',
  'taniel.bsky.social',
  'krassenstein.bsky.social',
  'timobrien.bsky.social',
  'billkristolbulwark.bsky.social',
  'tizzyent.bsky.social',
  'nbcnews.com',
  'hwinkler4real.bsky.social',
  'gregsargent.bsky.social',
  'aclu.org',
  'esqueer.net',
  'sykescharlie.bsky.social',
  'alexwinter.com',
  'drericding.bsky.social',
  'redditspaceviewes.bsky.social',
  'ilhanmn.bsky.social',
  'michaelcohen212.bsky.social',
  'aljazeera.com',
  'scifri.bsky.social',
  'benjaminwittes.lawfaremedia.org',
  'ericswalwell.bsky.social',
  'dknight10k.bsky.social',
  'jerilryan.bsky.social',
  '50501movement.bsky.social',
  'davidfrum.bsky.social',
  'wsj.com',
  'davidleavitt.bsky.social',
  'heatherthomasaf.bsky.social',
  'kenjennings.bsky.social',
  'wyden.senate.gov',
  'ericholder.bsky.social',
  'santiagomayer.com',
  'votevets.org',
  'techcrunch.com',
  'joshuajfriedman.com',
  'monicalewinsky.bsky.social',
  'peterstefanovic.bsky.social',
  'kekeflipnote.bsky.social',
  'clarajeffery.bsky.social',
  'brandyzadrozny.bsky.social',
  'drewharwell.com',
  'swin24.bsky.social',
  'georgemonbiot.bsky.social',
  'pwnallthethings.bsky.social',
  'oliviajulianna.bsky.social',
  'patti3333.bsky.social',
  'darthbluesky.bsky.social',
  'mcspocky.bsky.social',
  'rebeccasolnit.bsky.social',
  'moreperfectunion.bsky.social',
  'theintercept.com',
  'shannonrwatts.bsky.social',
  'kamalaharris.com',
  'corybooker.com',
  'mark-carney.bsky.social',
  'michaelhobbes.bsky.social',
  'nicollewallace.bsky.social',
  'planetadofutebol.bsky.social',
  'harryjsisson.bsky.social',
  'devincow.bsky.social',
  'bradleywhitford.bsky.social',
  'techconnectify.bsky.social',
  'axidentaliberal.bsky.social',
  'jonfavs.bsky.social',
  'kyivindependent.com',
  'altyellonatpark.org',
  'lukelukeluke.bsky.social',
  'hbomberguy.bsky.social',
  'chriswarcraft.bsky.social',
  'wordswithsteph.bsky.social',
  'jctheresistance.demcast.com',
  '404media.co',
  'timmiller.bsky.social',
  'vancityreynolds.bsky.social',
  'petersagal.bsky.social',
  'drdind.bsky.social',
  'discussingfilm.net',
  'adammockler.com',
  'palmerreport.com',
  'noupside.bsky.social',
  'kfile.bsky.social',
  'malena.bsky.social',
  'carolvorders.bsky.social',
  'kellyscaletta.bsky.social',
  'out5p0ken.bsky.social',
  'profmmurray.bsky.social',
  'mommamia.bsky.social',
  'ign.com',
  'oliverdarcy.bsky.social',
  'mnateshyamalan.bsky.social',
  'wutangforchildren.bsky.social',
  'edzitron.com',
  'mikenellis.bsky.social',
  'duolingobrasil.com.br',
  'kattenbarge.bsky.social',
  'artbutmakeitsports.bsky.social',
  'girlsreallyrule.bsky.social',
  'jairme.bsky.social',
  'iwriteok.bsky.social',
  'who.int',
  'beingliberal.bsky.social',
  'rmac.bsky.social',
  'vox.com',
  'rachelbitecofer.bsky.social',
  'wolfiesmom.bsky.social',
  'pbump.com',
  'kathygriffin.bsky.social',
  'maya4rights.bsky.social',
  'lizcheney.bsky.social',
  'lalalalack.bsky.social',
  'maxkennerly.bsky.social',
  'chicobarney.bsky.social',
  'donmoyn.bsky.social',
  'lemonde.fr',
  'karenattiah.bsky.social',
  'lawfaremedia.org',
  'swordsjew.bsky.social',
  'isaiahrmartin.bsky.social',
  'hunterw.bsky.social',
  'prisonculture.bsky.social',
  'lizzobeeating.bsky.social',
  'rapsheet.bsky.social',
  'democraticwins.bsky.social',
  'petermorley.bsky.social',
  'rmayemsinger.bsky.social',
  'qasimrashid.com',
  'thedevil.bsky.social',
  'keeptroyblue.bsky.social',
  'velshi.com',
  'bannerite.bsky.social',
  'noahshachtman.bsky.social',
  'erictopol.bsky.social',
  'elpais.com',
  'sarahjeong.bsky.social',
  'cardonebrian.bsky.social',
  'pftompkins.bsky.social',
  'chocoharveymilk.bsky.social',
  'dionnewarwick.bsky.social',
  'heatherpaterson.co.uk',
  'espiers.bsky.social',
  'tnbrando.bsky.social',
  'data.ft.com',
  'peterbakernyt.bsky.social',
  'demcast.com',
  'lyndacarter.bsky.social',
  'tuyoki.bsky.social',
  'andrewjweinstein.com',
  'anamariecox.bsky.social',
  'mjsdc.bsky.social',
  'nadinesmith.bsky.social',
  'pdxeleven.bsky.social',
  'kairyssdal.bsky.social',
  'ryanjreilly.com',
  'macfarlanenews.bsky.social',
  'crampell.bsky.social',
  'bigjosh84.bsky.social',
  'weirdmedieval.bsky.social',
  'mary1kathy.bsky.social',
  'altcdc.altgov.info',
  'jasonkander.bsky.social',
  'kianamai.bsky.social',
  'alivitali.bsky.social',
  'decodingfoxnews.bsky.social',
  'dell.bsky.social',
  'georgehahn.com',
  'jasonschreier.bsky.social',
  'lisaloe.bsky.social',
  'lee-in-iowa.bsky.social',
  'talkingpointsmemo.com',
  'jaywillis.net',
  'joshuarmartin.bsky.social',
  'kaylan.bsky.social',
  'helenkennedy.bsky.social',
  'mikeljollett.bsky.social',
  'piratesoftware.live',
  'mspopok.bsky.social',
  'alastaircampbell2.bsky.social',
  'skylee1.bsky.social',
  'whitehouse.senate.gov',
  'sandibachom.bsky.social',
  'xychelsea.tv',
  'nigella.bsky.social',
  'trisresists.bsky.social',
  'bestofdyingtwit.bsky.social',
  'brianstelter.bsky.social',
  'unicouniuni3.bsky.social',
  'antifapuddinpop.bsky.social',
  'uishig.bsky.social',
  'joshchafetz.bsky.social',
  'jennycohn.bsky.social',
  'iamgabesanchez.bsky.social',
  'sari.bsky.social',
  'charliesavage.bsky.social',
  'carlbergstrom.com',
  'simzart.bsky.social',
  'gregolear.bsky.social',
  'eldiario.es',
  'lewisgoodall.com',
  'mindyanns.bsky.social',
  'chastenbuttigieg.bsky.social',
  'wario64.bsky.social',
  'notalawyer.bsky.social',
  'underthedesknews.bsky.social',
  'reallyamerican.bsky.social',
  'mayoisspicyy.bsky.social',
  'iandunt.bsky.social',
  'analisaswan.bsky.social',
  'katharinehayhoe.com',
  'theferocity.bsky.social',
  'eff.org',
  'amandaknox.com',
  'elizaorlins.bsky.social',
  'quintabrunson.bsky.social',
  'mkbhd.com',
  'bylinetimes.bsky.social',
  'juliadavisnews.bsky.social',
  'smith.senate.gov',
  'jpbrammer.bsky.social',
  'lkrozen.bsky.social',
  'pearlmania500.bsky.social',
  'wtfgop.bsky.social',
  'browneyedsusan.bsky.social',
  'drjackbrown.bsky.social',
  'richardbranson.bsky.social',
  'drdigipol.bsky.social',
  'laurenwindsor.bsky.social',
  'randyrainbow.bsky.social',
  'barbrastreisand.bsky.social',
  'mimirocah1.bsky.social',
  'depthsofwikipedia.bsky.social',
  'eliothiggins.bsky.social',
  'jasonleopold.bsky.social',
  'the-independent.com',
  'karlykingsley.bsky.social',
  'emilynussbaum.bsky.social',
  'rweingarten.bsky.social',
  'laurapackard.com',
  'jeffjarvis.bsky.social',
  'olufemiotaiwo.bsky.social',
  'jfallows.bsky.social',
  'cooltxchick.bsky.social',
  'sarahwood.bsky.social',
  'pippacrerar.bsky.social',
  'ianbassin.bsky.social',
  'newrepublic.com',
  'sarahkendzior.bsky.social',
  'naomiaklein.bsky.social',
  'markoraassina.bsky.social',
  'normornstein.bsky.social',
  'brendannyhan.bsky.social',
  'kfa-legal.bsky.social',
  'shanlonwu.com',
  'bluestormcomin1.bsky.social',
  'contrariannews.org',
  'algreen.house.gov',
  'sillymickel.bsky.social',
  'alyssamilano.bsky.social',
  'jonathanslater.bsky.social',
  'brennanleemulligan.bsky.social',
  'rotterdamvvg.bsky.social',
  'moon1over.bsky.social',
  'rollingstone.com',
  'justinhendrix.bsky.social',
  'walshfreedom.bsky.social',
  'willsommer.bsky.social',
  'playstation.com',
  'robertcooper-us.bsky.social',
  'eve6.bsky.social',
  'ynb.bsky.social',
  'theswprincess.bsky.social',
];

async function seed() {
  const unique = [...new Set(HANDLES.map(h => h.toLowerCase()))];
  console.log(`\nSeeding ${unique.length} Bluesky creators in batches of ${BATCH_SIZE}...\n`);
  console.log(`Date: ${getTodayLocal()} (America/New_York)\n`);

  const batches = [];
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    batches.push(unique.slice(i, i + BATCH_SIZE));
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`Batch ${b + 1}/${batches.length}...`);

    let profiles;
    try {
      profiles = await fetchProfiles(batch);
    } catch (err) {
      console.error(`  Batch fetch failed: ${err.message}`);
      errors += batch.length;
      await sleep(DELAY_MS);
      continue;
    }

    const byHandle = new Map(profiles.map(p => [p.handle.toLowerCase(), p]));

    for (const handle of batch) {
      const profile = byHandle.get(handle.toLowerCase());
      if (!profile) {
        console.log(`  Not found: ${handle}`);
        skipped++;
        continue;
      }

      if (!profile.followersCount) {
        console.log(`  Skipped (0 followers): @${profile.handle}`);
        skipped++;
        continue;
      }

      try {
        const { data: existing } = await supabase
          .from('creators')
          .select('id')
          .eq('platform', 'bluesky')
          .eq('platform_id', profile.did)
          .maybeSingle();

        const creator = await upsertCreator(profile);
        await saveCreatorStats(creator.id, profile);

        const followers = (profile.followersCount ?? 0).toLocaleString();
        if (existing) {
          console.log(`  Updated: @${profile.handle} (${followers} followers)`);
          updated++;
        } else {
          console.log(`  Added:   @${profile.handle} (${followers} followers)`);
          added++;
        }
      } catch (err) {
        console.error(`  Error for @${handle}: ${err.message}`);
        errors++;
      }
    }

    if (b < batches.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone.`);
  console.log(`  Added:   ${added}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped} (not found or 0 followers)`);
  console.log(`  Errors:  ${errors}`);
}

seed().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

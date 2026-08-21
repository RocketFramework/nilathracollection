const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/dictionaries/en.json');
const frPath = path.join(__dirname, '../src/dictionaries/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Copy structure and translate main top-level sections to French
const fr = JSON.parse(JSON.stringify(en));

fr.hero = {
    subtitle: "Exclusivement au Sri Lanka",
    title_part1: "La meilleure agence de voyage au Sri Lanka pour",
    title_part2: "Voyages de luxe sur mesure",
    description: "Découvrez le sommet de l'hospitalité au cœur de l'océan Indien. Des villas privées au service VIP, Nilathra Travels définit le luxe sri-lankais.",
    btn_design: "Concevoir mon expérience de luxe",
    btn_explore: "Explorer les destinations",
    scroll: "Défiler"
};

fr.home.partners_subtitle = "Notre Réseau Souverain";
fr.home.partners_title = "Réseau Exclusif de Partenaires d'Ultra-Luxe";
fr.home.partners_desc = "Nous entretenons des relations directes avec les plus beaux établissements et opérateurs du Sri Lanka. De l'achat privatif de villas et de l'aviation privée au yachting hauturier et à la protection rapprochée, notre écosystème garantit un confort absolu, une sécurité totale et un accès prioritaire.";
fr.home.brand_subtitle = "Une équipe d'hôteliers et de planteurs depuis 2012";
fr.home.brand_title = "Luxe Sans Filtre";
fr.home.brand_p1 = "La vision « Nilathra » est née d'une passion pour présenter le Sri Lanka sous sa forme la plus pure et la plus élégante. Nous croyons que le vrai luxe ne réside pas seulement dans les plus beaux hôtels ou les voitures les plus chères — il s'agit de l'accès à des expériences authentiques et émouvantes qui restent gravées dans la mémoire.";
fr.home.brand_p2 = "Notre nom, Nilathra, signifie « l'Horizon Bleu » où le ciel rencontre l'océan Indien — un symbole des possibilités infinies créées par notre équipe au Sri Lanka et dans notre bureau régional de Malé, aux Maldives. Basé à Colombo avec une présence régionale dédiée à Malé, nous sommes évolués d'un concierge boutique en un architecte de voyage de classe mondiale, au service d'une élite mondiale qui exige authenticité, confidentialité et sécurité irréprochable.";
fr.home.brand_p3 = "Nous ne faisons pas que réserver des hôtels ; nous tissons des liens. Nous ne planifions pas seulement des itinéraires ; nous composons des récits. Chaque itinéraire est un plan maître vivant, analysant les profils des voyageurs dans les moindres détails pour façonner le souvenir parfait de l'île.";
fr.home.years = "Années d'Excellence";
fr.home.stand_subtitle = "Nos Valeurs";
fr.home.stand_title = "Le Standard Nilathra";
fr.home.stand_desc = "Découvrez les trois piliers fondamentaux qui définissent notre engagement envers une hospitalité d'exception et un service sans compromis.";
fr.home.seo_subtitle = "Architectes des plus belles";
fr.home.seo_title2 = "Odyssées Sri-Lankaises";
fr.home.read_journal = "Lire nos derniers articles du journal";
fr.home.faq_subtitle = "Vos Questions";
fr.home.faq_title = "F.A.Q. Voyage d'Excellence";
fr.home.faq_desc = "Tout ce que vous devez savoir pour planifier votre odyssée de luxe au Sri Lanka.";
fr.home.quote = "\"Une expérience inégalée. De la villa privée à Ella à la prise en charge VIP fluide à Colombo, Nilathra Collection a dépassé toutes nos attentes. Le vrai luxe sri-lankais.\"";
fr.home.cta_subtitle = "Commencez votre voyage avec les meilleurs";
fr.home.cta_title = "Planifiez votre escapade au Sri Lanka";
fr.home.cta_btn1 = "Consultation Privée";
fr.home.cta_btn2 = "Contacter la Meilleure Agence";

fr.packages.subtitle = "Nos Collections";
fr.packages.title = "L'Art du Voyage";
fr.packages.desc = "Sélectionnez le niveau d'exclusivité idéal pour votre odyssée au Sri Lanka. Chaque collection est méticuleusement conçue pour vous offrir une expérience inégalée.";
fr.packages.learn_more = "En Savoir Plus";

fs.writeFileSync(frPath, JSON.stringify(fr, null, 4), 'utf8');
console.log('Successfully created fr.json');

import React from 'react';

export const TEAM_ISO_CODES: Record<string, string> = {
  "México": "mx",
  "África do Sul": "za",
  "Coreia do Sul": "kr",
  "Rep. Tcheca": "cz",
  "Canadá": "ca",
  "Bósnia": "ba",
  "Qatar": "qa",
  "Suíça": "ch",
  "Brasil": "br",
  "Marrocos": "ma",
  "Haiti": "ht",
  "Escócia": "gb-sct",
  "Estados Unidos": "us",
  "Paraguai": "py",
  "Austrália": "au",
  "Turquia": "tr",
  "Alemanha": "de",
  "Curaçao": "cw",
  "Costa do Marfim": "ci",
  "Equador": "ec",
  "Holanda": "nl",
  "Japão": "jp",
  "Suécia": "se",
  "Tunísia": "tn",
  "Bélgica": "be",
  "Egito": "eg",
  "Irã": "ir",
  "Nova Zelândia": "nz",
  "Espanha": "es",
  "Cabo Verde": "cv",
  "Arábia Saudita": "sa",
  "Uruguai": "uy",
  "França": "fr",
  "Senegal": "sn",
  "Iraque": "iq",
  "Noruega": "no",
  "Argentina": "ar",
  "Argélia": "dz",
  "Áustria": "at",
  "Jordânia": "jo",
  "Portugal": "pt",
  "Congo": "cd",
  "Uzbequistão": "uz",
  "Colômbia": "co",
  "Inglaterra": "gb-eng",
  "Croácia": "hr",
  "Gana": "gh",
  "Panamá": "pa"
};

const TEAM_EMOJIS: Record<string, string> = {
  "Página Inicial": "🏟️",
  "FIFA World Cup History": "🏆",
  "Figurinhas da Coca-Cola": "🥤"
};

export function renderTeamFlag(teamName: string, className: string = "w-8 h-6 rounded shadow-sm object-cover") {
  const iso = TEAM_ISO_CODES[teamName];
  if (iso) {
    return (
      <img 
        src={`https://flagcdn.com/w80/${iso}.png`} 
        srcSet={`https://flagcdn.com/w160/${iso}.png 2x`}
        alt={`${teamName} flag`}
        className={className}
      />
    );
  }
  
  const emoji = TEAM_EMOJIS[teamName] || "🌍";
  return <span className="drop-shadow-md">{emoji}</span>;
}

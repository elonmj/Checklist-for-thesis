import re
import json
import os

def parse_planning_md(file_path):
    """
    Parse le fichier planning2.md et extrait les données structurées.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Erreur : Le fichier {file_path} n'a pas été trouvé.")
        return None

    # Initialisation des structures de données
    db = {
        "phases": [],
        "weeks": [],
        "deliverables": [],
        "chapters": {}
    }

    current_phase = None
    current_week = None
    current_week_last_deliverable_index = -1 # Index du dernier livrable de la semaine courante

    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue

        # --- 1. Identifier les en-têtes de Phase ---
        # Pattern : ## **[Icone] NOM DE LA PHASE**
        phase_match = re.match(r'^## \*\*(?:[^ ]+ )?(PHASE [IVX]+) : (.+?)\*\*$', line)
        if phase_match:
            phase_roman = phase_match.group(1).split()[1] # Extraire I, II, III
            phase_num = {"I": 1, "II": 2, "III": 3}.get(phase_roman, 0)
            
            current_phase = {
                "id": f"phase_{phase_num}",
                "title": phase_match.group(2).strip(),
                "duration_weeks": 0, # Sera rempli plus tard
                "date_range": "",     # Sera rempli plus tard
                "objective": ""       # Sera rempli plus tard
            }
            db['phases'].append(current_phase)
            current_week = None # Réinitialiser la semaine courante
            current_week_last_deliverable_index = -1 # Réinitialiser l'index
            continue

        # --- 2. Identifier les en-têtes de Semaine ---
        # Pattern : #### **[Icone] PHASE X.Y - Titre de la sous-phase**
        week_match = re.match(r'^#### \*\*(?:[^ ]+ )?(PHASE ([IVX]+)\.([A-Z])) - (.+?)\*\*$', line)
        if week_match and current_phase:
            phase_roman = week_match.group(2)
            phase_num = {"I": 1, "II": 2, "III": 3}.get(phase_roman, 0)
            
            current_week = {
                "id": f"week_{len(db['weeks']) + 1}",
                "week_number": 0, # Sera déduit ou rempli plus tard
                "phase_id": f"phase_{phase_num}",
                "sub_phase_id": f"PHASE {phase_roman}.{week_match.group(3)}",
                "sub_phase_title": week_match.group(4).strip(),
                "date_range": "",  # Sera rempli plus tard
                "objective": ""    # Sera rempli plus tard
            }
            db['weeks'].append(current_week)
            current_week_last_deliverable_index = -1 # Réinitialiser pour la nouvelle semaine
            continue

        # --- 3. Parser les métadonnées en fonction du contexte ---
        # Si nous sommes dans une semaine, nous remplissons d'abord les données de la semaine.
        if current_week:
            # Chercher la ligne de numéro/date de semaine
            # Pattern : **Semaine X (dates) : Objectif**
            if not current_week.get('week_number') or not current_week.get('date_range'):
                 week_meta_match = re.match(r'^\*\*Semaine (\d+)\s*\(([^)]+)\)\s*:\s*(.+?)\*\*$', line)
                 if week_meta_match:
                     current_week['week_number'] = int(week_meta_match.group(1))
                     current_week['date_range'] = week_meta_match.group(2).strip()
                     # L'objectif peut aussi être sur cette ligne
                     if not current_week.get('objective'):
                         current_week['objective'] = week_meta_match.group(3).strip()
                     continue
            
            # Chercher l'objectif de la semaine s'il n'est pas sur la ligne précédente
            if not current_week.get('objective'):
                obj_match = re.match(r'^\*\*Objectif :\*\*\s*(.+)$', line)
                if obj_match:
                    current_week['objective'] = obj_match.group(1).strip()
                    continue

        # Si nous sommes dans une phase mais pas dans une semaine, remplir les données de la phase.
        elif current_phase:
            if not current_phase.get('duration_weeks') or not current_phase.get('date_range'):
                duration_match = re.match(r'^### \*\*Durée :\*\*\s*(\d+)\s*Semaines\s*\(([^)]+)\)', line)
                if duration_match:
                    current_phase['duration_weeks'] = int(duration_match.group(1))
                    current_phase['date_range'] = duration_match.group(2).strip()
                    continue
            
            if not current_phase.get('objective'):
                objective_match = re.match(r'^\*\*Objectif Stratégique :\*\*\s*(.+)$', line)
                if objective_match:
                    current_phase['objective'] = objective_match.group(1).strip()
                    continue

        # --- 4. Parser les Livrables, uniquement si nous sommes dans une semaine ---
        if current_week:
            # Pattern : - **ID [Nom]** Description
            del_match = re.match(r'^-\s*\*\*([A-Z0-9\.\-R]+)\*\*\s*(.*)', line)
            if del_match:
                deliverable_id = del_match.group(1).strip()
                description = del_match.group(2).strip()
                
                # Déterminer le type
                del_type = "Rédaction" if "R" in deliverable_id.split('.')[-1] else "Technique"

                new_deliverable = {
                    "id": deliverable_id,
                    "description": description,
                    "details": "",  # Sera rempli plus tard
                    "type": del_type,
                    "week_id": current_week['id'],
                    "status": "pending",
                    "progress": 0,
                    "link_to_result": ""
                }
                db['deliverables'].append(new_deliverable)
                current_week_last_deliverable_index = len(db['deliverables']) - 1 # Mettre à jour l'index

                # Gérer les chapitres pour les livrables de rédaction
                if del_type == "Rédaction":
                    chap_search = re.search(r'Chapitre (\d+)', description)
                    if chap_search:
                        chap_num = int(chap_search.group(1))
                        if chap_num not in db["chapters"]:
                            # Extraire le titre du chapitre
                            title_search = re.search(r'\(([^)]+)\)', description)
                            chap_title = title_search.group(1) if title_search else f"Chapitre {chap_num}"
                            db["chapters"][chap_num] = {
                                "id": f"chapter_{chap_num}",
                                "title": chap_title,
                                "status": "draft",
                                "progress": 0,
                                "related_deliverables": []
                            }
                        db["chapters"][chap_num]["related_deliverables"].append(deliverable_id)
                continue

            # Ajouter les détails au dernier livrable de la semaine courante
            if current_week_last_deliverable_index != -1 and (line.startswith('- *') or line.startswith('  - ')):
                detail_text = line.replace('- *', '').replace('*', '').replace('  -','').strip()
                # Ajouter avec un espace
                db['deliverables'][current_week_last_deliverable_index]['details'] += f"{detail_text} "
                continue

    # --- 5. Nettoyage Final ---
    # Convertir le dictionnaire de chapitres en une liste triée
    db["chapters"] = sorted(list(db["chapters"].values()), key=lambda x: int(x['id'].split('_')[1]))
    
    # Supprimer les espaces en trop dans les détails
    for d in db["deliverables"]:
        d["details"] = d["details"].strip()

    return db

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, 'planning2.md')
    output_path = os.path.join(script_dir, 'new_firebase_data.json')

    final_data = parse_planning_md(file_path)

    if final_data:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(final_data, f, indent=2, ensure_ascii=False)

        print(f"Successfully created final data file: {output_path}")
        print(f"   - Phases: {len(final_data['phases'])}")
        print(f"   - Weeks: {len(final_data['weeks'])}")
        print(f"   - Deliverables: {len(final_data['deliverables'])}")
        print(f"   - Chapters: {len(final_data['chapters'])}")
    else:
        print("Échec de la génération des données.")
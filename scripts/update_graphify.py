import sys
import json
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
from graphify.detect import detect, save_manifest

def update_graphify():
    print("[Graphify] Updating graphify knowledge graph...")
    root = Path(".")
    out_dir = Path("graphify-out")
    out_dir.mkdir(exist_ok=True)

    # 1. Detect
    detection = detect(root)
    (out_dir / ".graphify_detect.json").write_text(json.dumps(detection, indent=2, ensure_ascii=False), encoding="utf-8")

    # 2. Collect AST
    code_files = collect_files(root / "src")
    ast_result = extract(code_files, cache_root=root)
    (out_dir / ".graphify_ast.json").write_text(json.dumps(ast_result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[AST] {len(ast_result['nodes'])} nodes, {len(ast_result['edges'])} edges")

    # 3. Read semantic if present or create empty
    sem_path = out_dir / ".graphify_semantic.json"
    if sem_path.exists():
        sem_result = json.loads(sem_path.read_text(encoding="utf-8"))
    else:
        sem_result = {"nodes": [], "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0}

    # 4. Merge AST + Semantic
    seen = {n['id'] for n in ast_result['nodes']}
    merged_nodes = list(ast_result['nodes'])
    for n in sem_result.get('nodes', []):
        if n['id'] not in seen:
            merged_nodes.append(n)
            seen.add(n['id'])

    merged_edges = ast_result['edges'] + sem_result.get('edges', [])
    merged_hyperedges = sem_result.get('hyperedges', [])
    extraction = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': merged_hyperedges,
        'input_tokens': sem_result.get('input_tokens', 0),
        'output_tokens': sem_result.get('output_tokens', 0),
    }
    (out_dir / ".graphify_extract.json").write_text(json.dumps(extraction, indent=2, ensure_ascii=False), encoding="utf-8")

    # 5. Build Graph
    G = build_from_json(extraction, root=str(root), directed=False)
    if G.number_of_nodes() == 0:
        print("[Error] Graph is empty!")
        return

    communities = cluster(G)
    cohesion = score_all(G, communities)
    tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    
    # Read existing labels if any
    labels_path = out_dir / ".graphify_labels.json"
    if labels_path.exists():
        raw_labels = json.loads(labels_path.read_text(encoding="utf-8"))
        labels = {int(k): v for k, v in raw_labels.items()}
    else:
        labels = {cid: f"Community {cid}" for cid in communities}

    # Fill default label for any new community
    for cid in communities:
        if cid not in labels:
            labels[cid] = f"Community {cid}"

    questions = suggest_questions(G, communities, labels)

    # Export graph.json
    wrote = to_json(G, communities, str(out_dir / "graph.json"), force=True)
    report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, str(root), suggested_questions=questions)
    (out_dir / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")

    analysis = {
        'communities': {str(k): v for k, v in communities.items()},
        'cohesion': {str(k): v for k, v in cohesion.items()},
        'gods': gods,
        'surprises': surprises,
        'questions': questions,
    }
    (out_dir / ".graphify_analysis.json").write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8")
    save_manifest(detection.get('all_files') or detection.get('files', {}), root=str(root))

    print(f"[Done] Graph updated successfully: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities.")

if __name__ == "__main__":
    update_graphify()

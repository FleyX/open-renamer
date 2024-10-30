// ToolGood.Words.Translate.js
// 2020, Lin Zhijun, https://github.com/toolgood/ToolGood.Words
// Licensed under the Apache License 2.0
import {_s2t_s, _s2t_t, _t2hk_t, _t2hk_hk, _t2s_s, _t2tw_t, _t2s_t, _t2tw_tw} from './TranslateWord'

class TrieNode {
    Index = 0;
    Layer = 0;
    End = false;
    Char = '';
    Results = [];
    m_values = {};
    Failure = null;
    Parent = null;

    public Add(c) {
        if (this.m_values[c] != null) {
            return this.m_values[c];
        }
        var node = new TrieNode();
        node.Parent = this;
        node.Char = c;
        this.m_values[c] = node;
        return node;
    }


    public SetResults(index) {
        if (this.End == false) {
            this.End = true;
        }
        this.Results.push(index)
    }
}


class TrieNode2 {
    End = false;
    Results = [];
    m_values = {};
    minflag = 1;
    maxflag = 0;

    public Add(c, node3) {
        if (typeof c !== 'number') {
            c = parseInt(c);
        }
        if (this.minflag > c) {
            this.minflag = c;
        }
        if (this.maxflag < c) {
            this.maxflag = c;
        }
        this.m_values[c] = node3;
    }

    public SetResults(index) {
        if (this.End == false) {
            this.End = true;
        }
        if (this.Results.indexOf(index) == -1) {
            this.Results.push(index);
        }
    }

    public HasKey(c) {
        return this.m_values[c] != undefined;
    }

    public TryGetValue(c) {
        if (this.minflag <= c && this.maxflag >= c) {
            return this.m_values[c];
        }
        return null;
    }
}


class WordsSearch {


    _first: TrieNode2 = null;
    _keywords = [];
    _others = [];

    public SetKeywords(keywords) {
        this._keywords = keywords;
        let root = new TrieNode();

        let allNodeLayer = {};
        for (let i = 0; i < this._keywords.length; i++) {
            let p = this._keywords[i];
            let nd = root;
            for (let j = 0; j < p.length; j++) {
                nd = nd.Add(p.charCodeAt(j));
                if (nd.Layer == 0) {
                    nd.Layer = j + 1;
                    if (allNodeLayer[nd.Layer]) {
                        allNodeLayer[nd.Layer].push(nd)
                    } else {
                        allNodeLayer[nd.Layer] = [];
                        allNodeLayer[nd.Layer].push(nd)
                    }
                }
            }
            nd.SetResults(i);
        }

        let allNode: TrieNode[] = [];
        allNode.push(root);
        for (let key in allNodeLayer) {
            let nds = allNodeLayer[key];
            for (let i = 0; i < nds.length; i++) {
                allNode.push(nds[i]);
            }
        }
        allNodeLayer = null;

        for (let i = 1; i < allNode.length; i++) {
            let nd: TrieNode = allNode[i];
            nd.Index = i;
            let r = nd.Parent.Failure;
            let c = nd.Char;
            while (r != null && !r.m_values[c])
                r = r.Failure;
            if (r == null)
                nd.Failure = root;
            else {
                nd.Failure = r.m_values[c];
                for (let key2 in nd.Failure.Results) {
                    if (nd.Failure.Results.hasOwnProperty(key2) == false) {
                        continue;
                    }
                    let result = nd.Failure.Results[key2];
                    nd.SetResults(result);
                }
            }
        }
        root.Failure = root;

        let allNode2 = [];
        for (let i = 0; i < allNode.length; i++) {
            allNode2.push(new TrieNode2());
        }
        for (let i = 0; i < allNode2.length; i++) {
            let oldNode = allNode[i];
            let newNode = allNode2[i];

            for (let key in oldNode.m_values) {
                if (oldNode.m_values.hasOwnProperty(key) == false) {
                    continue;
                }
                let index = oldNode.m_values[key].Index;
                newNode.Add(key, allNode2[index]);
            }
            for (let index = 0; index < oldNode.Results.length; index++) {
                let item = oldNode.Results[index];
                newNode.SetResults(item);
            }

            oldNode = oldNode.Failure;
            while (oldNode != root) {
                for (let key in oldNode.m_values) {
                    if (oldNode.m_values.hasOwnProperty(key) == false) {
                        continue;
                    }
                    if (newNode.HasKey(key) == false) {
                        let index = oldNode.m_values[key].Index;
                        newNode.Add(key, allNode2[index]);
                    }
                }
                for (let index = 0; index < oldNode.Results.length; index++) {
                    let item = oldNode.Results[index];
                    newNode.SetResults(item);
                }
                oldNode = oldNode.Failure;
            }
        }
        allNode = null;
        root = null;
        this._first = allNode2[0];
    }

    public FindAll(text) {
        var ptr = null;
        var list = [];

        for (let i = 0; i < text.length; i++) {
            var t = text.charCodeAt(i);
            var tn = null;
            if (ptr == null) {
                tn = this._first.TryGetValue(t);
            } else {
                tn = ptr.TryGetValue(t);
                if (!tn) {
                    tn = this._first.TryGetValue(t);
                }
            }
            if (tn != null) {
                if (tn.End) {
                    for (let j = 0; j < tn.Results.length; j++) {
                        var item = tn.Results[j];
                        var keyword = this._keywords[item];
                        list.push({
                            Keyword: keyword,
                            Success: true,
                            End: i,
                            Start: i + 1 - this._keywords[item].length,
                            Index: item,
                        });
                    }
                }
            }
            ptr = tn;
        }
        return list;
    }
}

//---------------------------


//-----------------------
var s2tSearch = null; // WordsSearch
var t2sSearch = null;// WordsSearch
var t2twSearch = null;// WordsSearch
var tw2tSearch = null;// WordsSearch
var t2hkSearch = null;// WordsSearch
var hk2tSearch = null;// WordsSearch

/**
 * 转繁体中文
 * @param {any} text 原文本
 * @param {any} type 0、繁体中文，1、港澳繁体，2、台湾正体
 */
export function toTraditionalChinese(text: any, type: any) {
    if (type == undefined) {
        type = 0;
    }
    if (type > 2 || type < 0) {
        throw "type 不支持该类型";
    }

    var s2t = GetWordsSearch(true, 0);
    text = TransformationReplace(text, s2t);
    if (type > 0) {
        var t2 = GetWordsSearch(true, type);
        text = TransformationReplace(text, t2);
    }
    return text;
}

/**
 * 转简体中文
 * @param {any} text 原文本
 * @param {any} srcType 0、繁体中文，1、港澳繁体，2、台湾正体
 */
export function toSimplifiedChinese(text: string, srcType: any) {
    if (srcType == undefined) {
        srcType = 0;
    }
    if (srcType > 2 || srcType < 0) {
        throw "srcType 不支持该类型";
    }
    if (srcType > 0) {
        var t2 = GetWordsSearch(false, srcType);
        text = TransformationReplace(text, t2);
    }
    var s2t = GetWordsSearch(false, 0);
    text = TransformationReplace(text, s2t);
    return text;
}

function TransformationReplace(text: any, wordsSearch: any) {
    var ts = wordsSearch.FindAll(text);

    var sb = "";
    var index = 0;
    while (index < text.length) {
        var t = null;
        var max = -1;
        for (var i = 0; i < ts.length; i++) {
            var f = ts[i];
            if (f.Start == index && f.End > max) {
                max = f.End;
                t = f;
            }
        }

        if (t == null) {
            sb += text[index];
            index++;
        } else {
            sb += wordsSearch._others[t.Index]
            index = t.End + 1;
        }
    }
    return sb;
}

function GetWordsSearch(s2t: boolean, srcType: number) {
    if (s2t) {
        if (srcType === 0) {
            if (s2tSearch == null) {
                s2tSearch = BuildWordsSearch(_s2t_s, _s2t_t);
            }
            return s2tSearch;
        } else if (srcType === 1) {
            if (t2hkSearch == null) {
                t2hkSearch = BuildWordsSearch(_t2hk_t, _t2hk_hk);
            }
            return t2hkSearch;
        } else if (srcType == 2) {
            if (t2twSearch == null) {
                t2twSearch = BuildWordsSearch(_t2tw_t, _t2tw_tw);
            }
            return t2twSearch;
        }
    }
    if (srcType == 0) {
        if (t2sSearch == null) {
            t2sSearch = BuildWordsSearch(_t2s_t, _t2s_s);
        }
        return t2sSearch;
    } else if (srcType == 1) {
        if (hk2tSearch == null) {
            hk2tSearch = BuildWordsSearch(_t2hk_hk, _t2hk_t);
        }
        return hk2tSearch;
    } else if (srcType == 2) {
        if (tw2tSearch == null) {
            tw2tSearch = BuildWordsSearch(_t2tw_tw, _t2tw_t);
        }
        return tw2tSearch;
    }
    return null;
}

function BuildWordsSearch(keywords: string[], toWords: any[]) {
    var wordsSearch = new WordsSearch();
    wordsSearch.SetKeywords(keywords);
    wordsSearch._others = toWords;
    return wordsSearch;
}
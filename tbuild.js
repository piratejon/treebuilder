/*jslint browser:true */
var tb = (function () {
    "use strict";
    var translators;

    translators = {
        /*
         * from_XXX provides:
         *   create_element(text, [root])
         *   get_next_sibling(elt)
         *   get_previous_sibling(elt)
         *   get_value(elt)
         *   get_first_child(elt)
         *   iterate_children(elt, fn)
         *   append_child(append_to, appendee)
         */

        'from_dom': {
            // elt is an LI which contains a SPAN, INPUT, INPUT, INPUT, INPUT, INPUT, UL
            'create_element': function (text, root) {
                var li, child_elts, i, parent_this;

                parent_this = this;

                function get_target_element(e) {
                    // <http://stackoverflow.com/a/1553668>
                    var tgt;
                    e = e || window.event;
                    tgt = e.target || e.srcElement;
                    if (tgt.nodeType === 3) {
                        tgt = tgt.parentNode;
                    }
                    return tgt;
                }

                child_elts = [
                    ['span', {
                        'textContent':  '-',
                        'onclick':      function (e) {
                            var tgt;
                            tgt = get_target_element(e).parentNode.lastElementChild;
                            if (tgt.style.display === 'none') {
                                tgt.style.display = 'block';
                                tgt.parentNode.firstElementChild.textContent = '-';
                            } else {
                                tgt.style.display = 'none';
                                tgt.parentNode.firstElementChild.textContent = '+';
                            }
                        }
                    }],
                    ['input', { 'type': 'text', 'value': text, 'size': 6 }],
                    ['input', {
                        'type':     'button',
                        'value':    '+',
                        'onclick':  function (e) {
                            var tgt;
                            tgt = get_target_element(e);
                            tgt.parentElement.lastElementChild.appendChild(parent_this.create_node());
                        }
                    }],
                    ['input', {
                        'type':     'button',
                        'value':    'x',
                        'onclick':  function (e) {
                            var tgt;
                            tgt = get_target_element(e).parentElement;
                            if (tgt !== null && tgt.parentElement !== null) {
                                tgt.parentElement.removeChild(tgt);
                            }
                        }
                    }],
                    ['input', {
                        'type':     'button',
                        'value':    '^',
                        'onclick':  function (e) {
                            // swap with previous sibling if any
                            var tgt;
                            tgt = get_target_element(e).parentNode;

                            if (tgt.previousElementSibling !== null && tgt.parentNode !== null) {
                                tgt.parentNode.insertBefore(tgt, tgt.previousElementSibling);
                            }
                        }
                    }],
                    ['input', {
                        'type':     'button',
                        'value':    'v',
                        'onclick':  function (e) {
                            // swap with next sibling if any
                            var tgt;
                            tgt = get_target_element(e).parentNode;

                            if (tgt.nextElementSibling !== null && tgt.parentNode !== null) {
                                tgt.parentNode.insertBefore(tgt.nextElementSibling, tgt);
                            }
                        }
                    }],
                    ['ul', {}]
                ];

                li = root.createElement('li');

                function element_from_descriptor(element_descriptor) {
                    var elt, prop, key;
                    elt = root.createElement(element_descriptor[0]);
                    prop = element_descriptor[1];
                    for (key in prop) {
                        if (prop.hasOwnProperty(key)) {
                            elt[key] = prop[key];
                        }
                    }
                    return elt;
                }

                for (i = 0; i < child_elts.length; i += 1) {
                    li.appendChild(element_from_descriptor(child_elts[i]));
                }

                return li;
            },
            'get_next_sibling': function (elt) {
                return elt.nextElementSibling;
            },
            'get_previous_sibling': function (elt) {
                return elt.previousElementSibling;
            },
            'get_value': function (elt) {
                return elt.firstElementChild.nextElementSibling.value;
            },
            'get_first_child': function (elt) {
                if (elt.lastElementChild.tagName === 'UL') {
                    return elt.lastElementChild.firstElementChild;
                }
                return null;
            },
            'iterate_children': function (elt, fn) {
                var kid;
                for (kid = this.get_first_child(elt); kid !== null; kid = this.get_next_sibling(kid)) {
                    fn(kid);
                }
            },
            'append_child': function (elt, elt2) {
                elt.lastElementChild.appendChild(elt2);
            }
        },

        'from_xml': {
            'create_element': function (text, root) {
                var node, attr;

                if (this.root === undefined) {
                    this.root = 
                }
                attr = root.createAttribute('value');
                attr.nodeValue = text;
                node = root.createElement('node');
                node.setAttributeNode(attr);
                return node;
            },
            'get_next_sibling': function (node) {
                return node.nextElementSibling;
            },
            'get_previous_sibling': function (node) {
                return node.previousElementSibling;
            },
            'get_value': function (node) {
                return node.getAttribute('value');
            },
            'get_first_child': function (node) {
                return node.firstElementChild;
            },
            'iterate_children': function (node, fn) {
                var kid;
                for (kid = this.get_first_child(node); kid !== null; kid = this.get_next_sibling(kid)) {
                    fn(kid);
                }
            },
            'append_child': function (node, node2) {
                node.appendChild(node2);
            }
        }
    };

    function remove_element_children(e) {
        while (e.firstChild) {
            e.removeChild(e.firstChild);
        }
    }

    function serialize(elt) {
        // elt is an LI in our UL#nodetree
        // it has children SPAN, INPUT, INPUT, INPUT, INPUT, INPUT, and optional UL
        var node, attr;

        node = translators.from_xml.create_node(translators.from_dom.get_value(elt));

        translators.from_dom.element_child_iterator(elt, function (kid) {
            translators.from_xml.append_child(node, serialize(kid));
        });

        return node;
    }

    function unserialize(node) {
        var elt;

        elt = translators.from_dom.create_node(translators.from_xml.get_value(node));

        translators.from_xml.node_child_iterator(node, function (kid) {
            eranslators.from_dom.append_child(elt, (unserialize(kid));
        });

        return elt;
    }

    function serialize_to(id) {
        var target, root;

        target = document.getElementById(id);

        root = document.implementation.createDocument(null, 'nodetree', null);

        root.documentElement.appendChild(serialize(document.getElementById('nodetree').firstElementChild, root));

        target.value = (new window.XMLSerializer()).serializeToString(root);
    }

    function unserialize_from(id) {
        var src_raw, src_xml, dst, src_root;

        src_raw = document.getElementById(id).value;
        src_xml = (new window.DOMParser()).parseFromString(src_raw, 'text/xml');
        src_root = src_xml.firstChild.firstChild;

        dst = document.getElementById('nodetree');

        remove_element_children(dst);

        dst.appendChild(unserialize(src_root));
    }

    function insert_root_node(id) {
        remove_element_children(document.getElementById(id));
        document.getElementById(id).appendChild(translators.from_dom.create_node());
    }

    return {
        'insert_root_node': insert_root_node,
        'serialize_to': serialize_to,
        'unserialize_from': unserialize_from
    };
}());

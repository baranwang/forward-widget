import * as $protobuf from "protobufjs";
import Long = require("long");

/** Namespace biliproto. */
export namespace biliproto {

    /** Namespace community. */
    namespace community {

        /** Namespace service. */
        namespace service {

            /** Namespace dm. */
            namespace dm {

                /** Namespace v1. */
                namespace v1 {

                    /**
                     * Properties of a DanmakuElem.
                     * @deprecated Use biliproto.community.service.dm.v1.DanmakuElem.$Properties instead.
                     */
                    interface IDanmakuElem extends biliproto.community.service.dm.v1.DanmakuElem.$Properties {
                    }

                    /** Represents a DanmakuElem. */
                    class DanmakuElem {

                        /**
                         * Constructs a new DanmakuElem.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: biliproto.community.service.dm.v1.DanmakuElem.$Properties);

                        /** Unknown fields preserved while decoding */
                        $unknowns?: Uint8Array[];

                        /** DanmakuElem id. */
                        id: (number|Long);

                        /** DanmakuElem progress. */
                        progress: number;

                        /** DanmakuElem mode. */
                        mode: number;

                        /** DanmakuElem fontsize. */
                        fontsize: number;

                        /** DanmakuElem color. */
                        color: number;

                        /** DanmakuElem midHash. */
                        midHash: string;

                        /** DanmakuElem content. */
                        content: string;

                        /** DanmakuElem ctime. */
                        ctime: (number|Long);

                        /** DanmakuElem weight. */
                        weight: number;

                        /** DanmakuElem action. */
                        action: string;

                        /** DanmakuElem pool. */
                        pool: number;

                        /** DanmakuElem idStr. */
                        idStr: string;

                        /** DanmakuElem attr. */
                        attr: number;

                        /** DanmakuElem animation. */
                        animation: string;

                        /** DanmakuElem likeNum. */
                        likeNum: number;

                        /** DanmakuElem colorV2. */
                        colorV2: string;

                        /** DanmakuElem dmTypeV2. */
                        dmTypeV2: number;

                        /**
                         * Creates a new DanmakuElem instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns DanmakuElem instance
                         */
                        static create(properties: biliproto.community.service.dm.v1.DanmakuElem.$Shape): biliproto.community.service.dm.v1.DanmakuElem & biliproto.community.service.dm.v1.DanmakuElem.$Shape;
                        static create(properties?: biliproto.community.service.dm.v1.DanmakuElem.$Properties): biliproto.community.service.dm.v1.DanmakuElem;

                        /**
                         * Encodes the specified DanmakuElem message. Does not implicitly {@link biliproto.community.service.dm.v1.DanmakuElem.verify|verify} messages.
                         * @param message DanmakuElem message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        static encode(message: biliproto.community.service.dm.v1.DanmakuElem.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified DanmakuElem message, length delimited. Does not implicitly {@link biliproto.community.service.dm.v1.DanmakuElem.verify|verify} messages.
                         * @param message DanmakuElem message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        static encodeDelimited(message: biliproto.community.service.dm.v1.DanmakuElem.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a DanmakuElem message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns {biliproto.community.service.dm.v1.DanmakuElem & biliproto.community.service.dm.v1.DanmakuElem.$Shape} DanmakuElem
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): biliproto.community.service.dm.v1.DanmakuElem & biliproto.community.service.dm.v1.DanmakuElem.$Shape;

                        /**
                         * Decodes a DanmakuElem message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns {biliproto.community.service.dm.v1.DanmakuElem & biliproto.community.service.dm.v1.DanmakuElem.$Shape} DanmakuElem
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): biliproto.community.service.dm.v1.DanmakuElem & biliproto.community.service.dm.v1.DanmakuElem.$Shape;

                        /**
                         * Verifies a DanmakuElem message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a DanmakuElem message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns DanmakuElem
                         */
                        static fromObject(object: { [k: string]: any }): biliproto.community.service.dm.v1.DanmakuElem;

                        /**
                         * Creates a plain object from a DanmakuElem message. Also converts values to other types if specified.
                         * @param message DanmakuElem
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        static toObject(message: biliproto.community.service.dm.v1.DanmakuElem, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this DanmakuElem to JSON.
                         * @returns JSON object
                         */
                        toJSON(): { [k: string]: any };

                        /**
                         * Gets the type url for DanmakuElem
                         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
                         * @returns The type url
                         */
                        static getTypeUrl(prefix?: string): string;
                    }

                    namespace DanmakuElem {

                        /** Properties of a DanmakuElem. */
                        interface $Properties {

                            /** DanmakuElem id */
                            id?: (number|Long|null);

                            /** DanmakuElem progress */
                            progress?: (number|null);

                            /** DanmakuElem mode */
                            mode?: (number|null);

                            /** DanmakuElem fontsize */
                            fontsize?: (number|null);

                            /** DanmakuElem color */
                            color?: (number|null);

                            /** DanmakuElem midHash */
                            midHash?: (string|null);

                            /** DanmakuElem content */
                            content?: (string|null);

                            /** DanmakuElem ctime */
                            ctime?: (number|Long|null);

                            /** DanmakuElem weight */
                            weight?: (number|null);

                            /** DanmakuElem action */
                            action?: (string|null);

                            /** DanmakuElem pool */
                            pool?: (number|null);

                            /** DanmakuElem idStr */
                            idStr?: (string|null);

                            /** DanmakuElem attr */
                            attr?: (number|null);

                            /** DanmakuElem animation */
                            animation?: (string|null);

                            /** DanmakuElem likeNum */
                            likeNum?: (number|null);

                            /** DanmakuElem colorV2 */
                            colorV2?: (string|null);

                            /** DanmakuElem dmTypeV2 */
                            dmTypeV2?: (number|null);

                            /** Unknown fields preserved while decoding */
                            $unknowns?: Uint8Array[];
                        }

                        /** Shape of a DanmakuElem. */
                        type $Shape = biliproto.community.service.dm.v1.DanmakuElem.$Properties;
                    }

                    /**
                     * Properties of a Flag.
                     * @deprecated Use biliproto.community.service.dm.v1.Flag.$Properties instead.
                     */
                    interface IFlag extends biliproto.community.service.dm.v1.Flag.$Properties {
                    }

                    /** Represents a Flag. */
                    class Flag {

                        /**
                         * Constructs a new Flag.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: biliproto.community.service.dm.v1.Flag.$Properties);

                        /** Unknown fields preserved while decoding */
                        $unknowns?: Uint8Array[];

                        /** Flag value. */
                        value: number;

                        /** Flag description. */
                        description: string;

                        /**
                         * Creates a new Flag instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns Flag instance
                         */
                        static create(properties: biliproto.community.service.dm.v1.Flag.$Shape): biliproto.community.service.dm.v1.Flag & biliproto.community.service.dm.v1.Flag.$Shape;
                        static create(properties?: biliproto.community.service.dm.v1.Flag.$Properties): biliproto.community.service.dm.v1.Flag;

                        /**
                         * Encodes the specified Flag message. Does not implicitly {@link biliproto.community.service.dm.v1.Flag.verify|verify} messages.
                         * @param message Flag message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        static encode(message: biliproto.community.service.dm.v1.Flag.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified Flag message, length delimited. Does not implicitly {@link biliproto.community.service.dm.v1.Flag.verify|verify} messages.
                         * @param message Flag message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        static encodeDelimited(message: biliproto.community.service.dm.v1.Flag.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a Flag message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns {biliproto.community.service.dm.v1.Flag & biliproto.community.service.dm.v1.Flag.$Shape} Flag
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): biliproto.community.service.dm.v1.Flag & biliproto.community.service.dm.v1.Flag.$Shape;

                        /**
                         * Decodes a Flag message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns {biliproto.community.service.dm.v1.Flag & biliproto.community.service.dm.v1.Flag.$Shape} Flag
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): biliproto.community.service.dm.v1.Flag & biliproto.community.service.dm.v1.Flag.$Shape;

                        /**
                         * Verifies a Flag message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a Flag message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns Flag
                         */
                        static fromObject(object: { [k: string]: any }): biliproto.community.service.dm.v1.Flag;

                        /**
                         * Creates a plain object from a Flag message. Also converts values to other types if specified.
                         * @param message Flag
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        static toObject(message: biliproto.community.service.dm.v1.Flag, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this Flag to JSON.
                         * @returns JSON object
                         */
                        toJSON(): { [k: string]: any };

                        /**
                         * Gets the type url for Flag
                         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
                         * @returns The type url
                         */
                        static getTypeUrl(prefix?: string): string;
                    }

                    namespace Flag {

                        /** Properties of a Flag. */
                        interface $Properties {

                            /** Flag value */
                            value?: (number|null);

                            /** Flag description */
                            description?: (string|null);

                            /** Unknown fields preserved while decoding */
                            $unknowns?: Uint8Array[];
                        }

                        /** Shape of a Flag. */
                        type $Shape = biliproto.community.service.dm.v1.Flag.$Properties;
                    }

                    /**
                     * Properties of a DmSegMobileReply.
                     * @deprecated Use biliproto.community.service.dm.v1.DmSegMobileReply.$Properties instead.
                     */
                    interface IDmSegMobileReply extends biliproto.community.service.dm.v1.DmSegMobileReply.$Properties {
                    }

                    /** Represents a DmSegMobileReply. */
                    class DmSegMobileReply {

                        /**
                         * Constructs a new DmSegMobileReply.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: biliproto.community.service.dm.v1.DmSegMobileReply.$Properties);

                        /** Unknown fields preserved while decoding */
                        $unknowns?: Uint8Array[];

                        /** DmSegMobileReply elems. */
                        elems: biliproto.community.service.dm.v1.DanmakuElem.$Properties[];

                        /** DmSegMobileReply state. */
                        state: number;

                        /** DmSegMobileReply aiFlagForSummary. */
                        aiFlagForSummary?: (biliproto.community.service.dm.v1.Flag.$Properties|null);

                        /**
                         * Creates a new DmSegMobileReply instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns DmSegMobileReply instance
                         */
                        static create(properties: biliproto.community.service.dm.v1.DmSegMobileReply.$Shape): biliproto.community.service.dm.v1.DmSegMobileReply & biliproto.community.service.dm.v1.DmSegMobileReply.$Shape;
                        static create(properties?: biliproto.community.service.dm.v1.DmSegMobileReply.$Properties): biliproto.community.service.dm.v1.DmSegMobileReply;

                        /**
                         * Encodes the specified DmSegMobileReply message. Does not implicitly {@link biliproto.community.service.dm.v1.DmSegMobileReply.verify|verify} messages.
                         * @param message DmSegMobileReply message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        static encode(message: biliproto.community.service.dm.v1.DmSegMobileReply.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified DmSegMobileReply message, length delimited. Does not implicitly {@link biliproto.community.service.dm.v1.DmSegMobileReply.verify|verify} messages.
                         * @param message DmSegMobileReply message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        static encodeDelimited(message: biliproto.community.service.dm.v1.DmSegMobileReply.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a DmSegMobileReply message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns {biliproto.community.service.dm.v1.DmSegMobileReply & biliproto.community.service.dm.v1.DmSegMobileReply.$Shape} DmSegMobileReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): biliproto.community.service.dm.v1.DmSegMobileReply & biliproto.community.service.dm.v1.DmSegMobileReply.$Shape;

                        /**
                         * Decodes a DmSegMobileReply message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns {biliproto.community.service.dm.v1.DmSegMobileReply & biliproto.community.service.dm.v1.DmSegMobileReply.$Shape} DmSegMobileReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): biliproto.community.service.dm.v1.DmSegMobileReply & biliproto.community.service.dm.v1.DmSegMobileReply.$Shape;

                        /**
                         * Verifies a DmSegMobileReply message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a DmSegMobileReply message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns DmSegMobileReply
                         */
                        static fromObject(object: { [k: string]: any }): biliproto.community.service.dm.v1.DmSegMobileReply;

                        /**
                         * Creates a plain object from a DmSegMobileReply message. Also converts values to other types if specified.
                         * @param message DmSegMobileReply
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        static toObject(message: biliproto.community.service.dm.v1.DmSegMobileReply, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this DmSegMobileReply to JSON.
                         * @returns JSON object
                         */
                        toJSON(): { [k: string]: any };

                        /**
                         * Gets the type url for DmSegMobileReply
                         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
                         * @returns The type url
                         */
                        static getTypeUrl(prefix?: string): string;
                    }

                    namespace DmSegMobileReply {

                        /** Properties of a DmSegMobileReply. */
                        interface $Properties {

                            /** DmSegMobileReply elems */
                            elems?: (biliproto.community.service.dm.v1.DanmakuElem.$Properties[]|null);

                            /** DmSegMobileReply state */
                            state?: (number|null);

                            /** DmSegMobileReply aiFlagForSummary */
                            aiFlagForSummary?: (biliproto.community.service.dm.v1.Flag.$Properties|null);

                            /** Unknown fields preserved while decoding */
                            $unknowns?: Uint8Array[];
                        }

                        /** Shape of a DmSegMobileReply. */
                        type $Shape = biliproto.community.service.dm.v1.DmSegMobileReply.$Properties;
                    }
                }
            }
        }
    }
}

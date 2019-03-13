// v11.3
(function () {
    var _scriptVersion = 11.3;
    // Private objects & functions
    var _inherit = (function () {
        function _() { }
        return function (child, parent) {
            _.prototype = parent.prototype;
            child.prototype = new _;
            child.prototype.constructor = child;
            child.superproto = parent.prototype;
            return child;
        };
    })();
    var _findInArray = function (arr, property, value) {
        if (arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i][property] == value)
                    return arr[i];
            }
        }
        return null;
    };
    var _addProperty = function (obj, name, writable, value) {
        if (!obj._privVals)
            obj._privVals = {};
        if (!obj._typeInfo)
            obj._typeInfo = {};
        if (!obj.propertyChanged)
            obj.propertyChanged = new _Event(obj);

        if (value != undefined)
            obj._privVals[name] = value;
        var propDef = { get: function () { return obj._privVals[name]; }, enumerable: true };
        if (writable) {
            propDef.set = function (newVal) {
                if (obj._privVals[name] != newVal) {
                    obj._privVals[name] = newVal;
                    obj.propertyChanged.raise(name);
                }
                if (obj._typeInfo[name])
                    delete obj._typeInfo[name];
            };
        }
        Object.defineProperty(obj, name, propDef);
    };
    var _bindHandler = function (handler, handlers, bind, scope) {
        if (bind || typeof bind == "undefined") {
            handlers.push({ handler: handler, scope: (scope ? scope : null) });
        }
        else {
            var index = 0;
            while (index < handlers.length) {
                if (handlers[index].handler === handler) {
                    handlers.splice(index, 1);
                }
                else {
                    index++;
                }
            }
        }
    };
    var _callHandlers = function (handlers) {
        var params = [];
        var i = 1;
        while (arguments[i])
            params.push(arguments[i++]);

        var result = false;
        for (var index in handlers) {
            var handlerDescriptor = handlers[index];
            if (handlerDescriptor && handlerDescriptor.handler) {
                var thisResult = handlerDescriptor.handler.apply(handlerDescriptor.scope, params);
                if (thisResult != false)
                    result = result || thisResult;
            }
        }
        return result;
    }
    var _Event = function (sender) {
        var _handlers = [],
            _handlersToRemove = [],
            _bRaisingEvent = false;


        this.add = function (handler, target) {
            var bExists = false;

            for (var index in _handlers) {
                var h = _handlers[index];
                if (h && h.handler == handler && h.target == target) {
                    bExists = true;
                    break;
                }
            }
            if (!bExists) {
                _handlers.push({ handler: handler, target: target });
            }
        }

        this.remove = function (handler, target) {
            var index = 0;

            while (index < _handlers.length) {
                var h = _handlers[index];

                if ((!handler || h.handler == handler) && (!target || h.target == target)) {
                    if (!_bRaisingEvent) {
                        _handlers.splice(index, 1);
                        index--;
                    }
                    else {
                        _handlersToRemove.push(h);
                    }
                }
                index++;
            }
        }

        this.clear = function () {
            if (!_bRaisingEvent) {
                _handlers = [];
            }
            else {
                _handlersToRemove = _handlers.slice(0);
            }
        }

        this.raise = function (eventArgs) {
            // Make sure every handler is called in raise(), if any handler is removed while in 'for' cycle, remove it after the loop finishes
            _bRaisingEvent = true;

            for (index in _handlers) {
                var h = _handlers[index];
                if (h && h.handler) {
                    h.handler.call(h.target ? h.target : sender, eventArgs, sender);
                    if (eventArgs && eventArgs.cancel) {
                        break;
                    }
                }
            }

            _bRaisingEvent = false;

            for (index in _handlersToRemove) {
                var hToRemove = _handlersToRemove[index];
                if (hToRemove)
                    this.remove(hToRemove.handler, hToRemove.target);
            }
        }
    };

    if (typeof MobileCrmException === "undefined") {
        MobileCrmException = function (msg) {
            this.message = msg;
            this.name = "MobileCrmException";
        };
        MobileCrmException.prototype.toString = function () { return this.message; };
    }

    // MobileCRM object definition
    if (typeof MobileCRM === "undefined") {
        MobileCRM = {
            /// <summary>An entry point for Mobile CRM data model.</summary>
            /// <field name="bridge" type="MobileCRM.Bridge">Singleton instance of <see cref="MobileCRM.Bridge">MobileCRM.Bridge</see> providing the management of the Javascript/native code cross-calls.</field>
            bridge: null,

            Bridge: function (platform) {
                /// <summary>Provides the management of the Javascript/native code cross-calls. Its only instance <see cref="MobileCRMbridge">MobileCRM.bridge</see> is created immediately after the &quot;JSBridge.js&quot; script is loaded.</summary>
                /// <param name="platform" type="String">A platform name</param>
                /// <field name="platform" type="String">A string identifying the device platform (e.g. Android, iOS, Windows, WindowsRT, Windows10 or WindowsPhone).</field>
                /// <field name="version" type="Number">A number identifying the version of the JSBridge. This is the version of the script which might not match the version of the application part of the bridge implementation. Application version must be equal or higher than the script version.</field>
                this.commandQueue = [];
                this.processing = false;
                this.callbacks = {};
                this.callbackId = 0;
                this.version = _scriptVersion;
                this.platform = platform;
            },

            Configuration: function () {
                /// <summary>Provides an access to the application configuration.</summary>
                /// <remarks>This object cannot be created directly. To obtain/modify this object, use <see cref="MobileCRM.Configuration.requestObject">MobileCRM.Configuration.requestObject</see> function.</remarks>
                /// <field name="applicationEdition" type="String">Gets the application edition.</field>
                /// <field name="applicationPath" type="String">Gets the application folder.</field>
                /// <field name="applicationVersion" type="String">Gets the application version (major.minor.subversion.build).</field>
                /// <field name="customizationDirectory" type="String">Gets or sets the runtime customization config root.</field>
                /// <field name="externalConfiguration" type="String">Gets the external configuration directory (either customization or legacy configuration).</field>
                /// <field name="isBackgroundSync" type="Boolean">Gets or sets whether background synchronization is in progress.</field>
                /// <field name="isOnline" type="Boolean">Gets or sets whether the online mode is currently active.</field>
                /// <field name="legacyVersion" type="String">Gets or sets the legacy redirect folder.</field>
                /// <field name="licenseAlert" type="String">Gets the flag set during sync indicating that the user&apos;s license has expired.</field>
                /// <field name="settings" type="MobileCRM._Settings">Gets the application settings.</field>
                /// <field name="storageDirectory" type="String">Gets the root folder of the application storage.</field>
            },

            CultureInfo: function () {
                /// <summary>[v10.2] Provides information about current device culture. The information includes the names for the culture, the writing system, the calendar used, and formatting for dates.</summary>
                /// <field name="name" type="String">Gets the culture name in the format languageCode/region (e.g. &quot;en-US&quot;). languageCode is a lowercase two-letter code derived from ISO 639-1. regioncode is derived from ISO 3166 and usually consists of two uppercase letters.</field>
                /// <field name="displayName" type="String">Gets the full localized culture name.</field>
                /// <field name="nativeName" type="String">Gets the culture name, consisting of the language, the country/region, and the optional script, that the culture is set to display.</field>
                /// <field name="ISOName" type="String">Gets the ISO 639-1 two-letter code for the language of the current CultureInfo.</field>
                /// <field name="isRightToLeft" type="Boolean">Gets a value indicating whether the current CultureInfo object represents a writing system where text flows from right to left.</field>
                /// <field name="dateTimeFormat" type="MobileCRM.DateTimeFormat">Gets a DateTimeFormat that defines the culturally appropriate format of displaying dates and times.</field>
                /// <field name="numberFormat" type="MobileCRM.NumberFormat">Gets a NumberFormat that defines the culturally appropriate format of displaying numbers, currency, and percentage.</field>
            },

            DateTimeFormat: function () {
                /// <summary>[v10.2] Provides culture-specific information about the format of date and time values.</summary>
                /// <field name="abbreviatedDayNames" type="String[]">Gets a string array containing the culture-specific abbreviated names of the days of the week.</field>
                /// <field name="abbreviatedMonthGenitiveNames" type="String[]">Gets a string array of abbreviated month names associated with the current DateTimeFormat object.</field>
                /// <field name="abbreviatedMonthNames" type="String[]">Gets a string array that contains the culture-specific abbreviated names of the months.</field>
                /// <field name="aMDesignator" type="String">Gets the string designator for hours that are "ante meridiem" (before noon).</field>
                /// <field name="dayNames" type="String[]">Gets a string array that contains the culture-specific full names of the days of the week.</field>
                /// <field name="firstDayOfWeek" type="Number">Gets the first day of the week (0=Sunday, 1=Monday, ...)</field>
                /// <field name="fullDateTimePattern" type="String">Gets the custom format string for a long date and long time value.</field>
                /// <field name="longDatePattern" type="String">Gets the custom format string for a long date value.</field>
                /// <field name="longTimePattern" type="String">Gets the custom format string for a long time value.</field>
                /// <field name="monthDayPattern" type="String">Gets the custom format string for a month and day value.</field>
                /// <field name="monthGenitiveNames" type="String[]">Gets a string array of month names associated with the current DateTimeFormat object.</field>
                /// <field name="monthNames" type="String[]">Gets a string array containing the culture-specific full names of the months.</field>
                /// <field name="pMDesignator" type="String">Gets the string designator for hours that are "post meridiem" (after noon).</field>
                /// <field name="shortDatePattern" type="String">Gets the custom format string for a short date value.</field>
                /// <field name="shortestDayNames" type="String[]">Gets a string array of the shortest unique abbreviated day names associated with the current DateTimeFormat object.</field>
                /// <field name="shortTimePattern" type="String">Gets the custom format string for a short time value.</field>
                /// <field name="sortableDateTimePattern" type="String">Gets the custom format string for a sortable date and time value.</field>
                /// <field name="universalSortableDateTimePattern" type="String">Gets the custom format string for a universal, sortable date and time string.</field>
                /// <field name="yearMonthPattern" type="String">Gets the custom format string for a year and month value.</field>
            },

            NumberFormat: function () {
                /// <summary>[v10.2] Provides culture-specific information for formatting and parsing numeric values.</summary>
                /// <field name="currencyDecimalDigits" type="Number">Gets the number of decimal places to use in currency values.</field>
                /// <field name="currencyDecimalSeparator" type="String">Gets the string to use as the decimal separator in currency values.</field>
                /// <field name="currencyGroupSeparator" type="String">Gets the string that separates groups of digits to the left of the decimal in currency values.</field>
                /// <field name="currencyGroupSizes" type="Number[]">Gets the number of digits in each group to the left of the decimal in currency values.</field>
                /// <field name="currencyNegativePattern" type="Number">Gets the format pattern for negative currency values.</field>
                /// <field name="currencyPositivePattern" type="Number">Gets the format pattern for positive currency values.</field>
                /// <field name="currencySymbol" type="String">Gets the string to use as the currency symbol.</field>
                /// <field name="naNSymbol" type="String">Gets the string that represents the IEEE NaN (not a number) value.</field>
                /// <field name="negativeInfinitySymbol" type="String">Gets the string that represents negative infinity.</field>
                /// <field name="negativeSign" type="String">Gets the string that denotes that the associated number is negative.</field>
                /// <field name="numberDecimalDigits" type="Number">Gets the number of decimal places to use in numeric values.</field>
                /// <field name="numberDecimalSeparator" type="String">Gets the string to use as the decimal separator in numeric values.</field>
                /// <field name="numberGroupSeparator" type="String">Gets the string that separates groups of digits to the left of the decimal in numeric values.</field>
                /// <field name="numberGroupSizes" type="Number[]"> Gets the number of digits in each group to the left of the decimal in numeric values.</field>
                /// <field name="numberNegativePattern" type="Number">Gets the format pattern for negative numeric values.</field>
                /// <field name="percentDecimalDigits" type="Number">Gets the number of decimal places to use in percent values.</field>
                /// <field name="percentDecimalSeparator" type="String">Gets the string to use as the decimal separator in percent values.</field>
                /// <field name="percentGroupSeparator" type="String">Gets the string that separates groups of digits to the left of the decimal in percent values.</field>
                /// <field name="percentGroupSizes" type="Number[]">Gets the number of digits in each group to the left of the decimal in percent values.</field>
                /// <field name="percentNegativePattern" type="Number">Gets the format pattern for negative percent values.</field>
                /// <field name="percentPositivePattern" type="Number">Gets the format pattern for positive percent values.</field>
                /// <field name="percentSymbol" type="String">Gets the string to use as the percent symbol.</field>
                /// <field name="perMilleSymbol" type="String">Gets the string to use as the per mille symbol.</field>
                /// <field name="positiveInfinitySymbol" type="String">Gets the string that represents positive infinity.</field>
                /// <field name="positiveSign" type="String">Gets the string that denotes that the associated number is positive.</field>
            },

            Localization: {
                stringTable: {},
                initialized: false
            },

            Reference: function (entityName, id, primaryName) {
                /// <summary>Represents an entity reference which provides the minimum information about an entity.</summary>
                /// <param name="entityName" type="String">The logical name of the reference, e.g. "account".</param>
                /// <param name="id" type="String">GUID of the existing entity or null for new one.</param>
                /// <param name="primaryName" type="String">The human readable name of the reference, e.g "Alexandro".</param>
                /// <field name="entityName" type="String">The logical name of the reference, e.g. "account".</field>
                /// <field name="id" type="String">GUID of the existing entity or null for new one.</field>
                /// <field name="isNew" type="Boolean">Indicates whether the entity is newly created.</field>
                /// <field name="primaryName" type="String">The human readable name of the reference, e.g. "Alexandro".</field>
                this.entityName = entityName;
                this.id = id;
                this.isNew = (id ? false : true);
                this.primaryName = primaryName;
            },

            Relationship: function (sourceProperty, target, intersectEntity, intersectProperty) {
                /// <summary>Represents a relationship between two entities.</summary>
                /// <param name="sourceProperty" type="String">Gets the name of the source of the relationship.</param>
                /// <param name="target" type="MobileCRM.Reference">Gets the target of the relationship.</param>
                /// <param name="intersectEntity" type="String">Gets the intersect entity if any. Used when displaying entities that are associated through a Many to Many relationship.</param>
                /// <param name="intersectProperty" type="String">Gets the intersect entity property if any. Used when displaying entities that are associated through a Many to Many relationship.</param>
                /// <field name="sourceProperty" type="String">Gets the name of the source of the relationship.</field>
                /// <field name="target" type="MobileCRM.Reference">Gets the target of the relationship.</field>
                /// <field name="intersectEntity" type="String">Gets the intersect entity if any. Used when displaying entities that are associated through a Many to Many relationship.</field>
                /// <field name="intersectProperty" type="String">Gets the intersect entity property if any. Used when displaying entities that are associated through a Many to Many relationship.</field>
                this.sourceProperty = sourceProperty;
                this.target = target;
                this.intersectEntity = intersectEntity;
                this.intersectProperty = intersectProperty;
            },

            ManyToManyReference: {
            },

            DynamicEntity: function (entityName, id, primaryName, properties, isOnline) {
                /// <summary>Represents a CRM entity, with only a subset of properties loaded.</summary>
                /// <remarks><p>This class is derived from <see cref="MobileCRM.Reference">MobileCRM.Reference</see></p><p>There is a compatibility issue since the version 7.4 which gets the boolean and numeric properties as native Javascript objects (instead of strings). If you experienced problems with these types of fields, switch on the legacy serialization by setting the static property MobileCRM.DynamicEntity.legacyPropsSerialization to true.</p></remarks>
                /// <param name="entityName" type="String">The logical name of the entity, e.g. "account".</param>
                /// <param name="id" type="String">GUID of the existing entity or null for new one.</param>
                /// <param name="primaryName" type="String">The human readable name of the entity, e.g "Alexandro".</param>
                /// <param name="properties" type="Object">An object with entity properties, e.g. {firstname:"Alexandro", lastname:"Puccini"}.</param>
                /// <param name="isOnline" type="Boolean">Indicates whether the entity was created by online request or from local data.</param>
                /// <field name="entityName" type="String">The logical name of the entity, e.g. "account".</field>
                /// <field name="id" type="String">GUID of the existing entity or null for new one.</field>
                /// <field name="isNew" type="Boolean">Indicates whether the entity is newly created.</field>
                /// <field name="isOnline" type="Boolean">Indicates whether the entity was created by online request or from local data.</field>
                /// <field name="forceDirty" type="Boolean">Indicates whether to force save the provided properties even if not modified. Default behavior is to save only properties that were modified.</field>
                /// <field name="primaryName" type="String">The human readable name of the entity, e.g. "Alexandro".</field>
                /// <field name="properties" type="Object">An object with entity properties, e.g. {firstname:"Alexandro", lastname:"Puccini"}.</field>
                MobileCRM.DynamicEntity.superproto.constructor.apply(this, arguments);
                this.isOnline = isOnline;
                if (properties) {
                    if (MobileCRM.DynamicEntity.legacyPropsSerialization) {
                        // This is a workaround for failing scripts in v7.4 (string/bool issue)
                        for (var i in properties) {
                            if (typeof (properties[i]) == "boolean")
                                properties[i] = properties[i].toString();
                        }
                    }
                    this.properties = new MobileCRM.ObservableObject(properties);
                }
                else
                    this.properties = {};
            },

            Metadata: {
                entities: null
            },

            MetaEntity: function (props) {
                /// <summary>Represents an entity metadata.</summary>
                /// <field name="isEnabled" type="Boolean">Indicates whether an entity is enabled. This field is used for limited runtime customization.</field>
                /// <field name="isExternal" type="Boolean">Indicates whether an entity stores data from external  sources Exchange/Google.</field>
                /// <field name="name" type="String">Gets the entity (logical) name.</field>
                /// <field name="objectTypeCode" type="Number">Gets the unique entity type code.</field>
                /// <field name="primaryFieldName" type="String">The name of the entity primary field (name) property.</field>
                /// <field name="primaryKeyName" type="String">The name of the entity primary key property.</field>
                /// <field name="relationshipName" type="String">Gets the name of the many-to-many relationship name. Defined only for intersect entities.</field>
                /// <field name="statusFieldName" type="String">Gets the status property name. In general it is called "statuscode" but there are exceptions.</field>
                /// <field name="uploadOnly" type="Boolean">Indicates whether this entity can be downloaded during synchronization.</field>
                /// <field name="attributes" type="Number">Gets additional entity attributes.</field>
                MobileCRM.MetaEntity.superproto.constructor.apply(this, arguments);
            },

            MetaProperty: function () {
                /// <summary>Represents a property (CRM field) metadata.</summary>
                /// <field name="name" type="String">Gets the field (logical) name.</field>
                /// <field name="required" type="Number">Gets the attribute requirement level (0=None, 1=SystemRequired, 2=Required, 3=Recommended, 4=ReadOnly).</field>
                /// <field name="type" type="Number">Gets the attribute CRM type (see <see cref="http://msdn.microsoft.com/en-us/library/microsoft.xrm.sdk.metadata.attributetypecode.aspx">MS Dynamics SDK</see>).</field>
                /// <field name="format" type="Number">Gets the attribute display format.</field>
                /// <field name="isVirtual" type="Boolean">Gets whether the property is virtual (has no underlying storage). State and PartyList properties are virtual.</field>
                /// <field name="isReference" type="Boolean">Gets whether the property is a reference (lookup) to another entity.</field>
                /// <field name="isNullable" type="Boolean">Gets whether the property may contain NULL.</field>
                /// <field name="defaultValue" type="">Gets the property default value.</field>
                /// <field name="targets" type="Array">Gets the names of target entities, if the property is a lookup, or customer.</field>
                /// <field name="minimum" type="Number">Gets the attribute minimum value.</field>
                /// <field name="maximum" type="Number">Gets the attribute minimum value.</field>
                /// <field name="precision" type="Number">Gets the numeric attribute&apos;s precision (decimal places).</field>
                /// <field name="permission" type="Number">Gets the attribute&apos;s permission set (0=None, 1=User, 2=BusinessUnit, 4=ParentChild, 8=Organization).</field>
                /// <field name="activityPartyType" type="Number">Gets the activity party type (from, to, attendee, etc.)</field>
                /// <field name="isMultiParty" type="Boolean">Gets whether the activity party property can have multiple values (multiple to, cc, resources.)</field>
                /// <field name="isSingularParty" type="Boolean">Gets whether the property represents a singular activity party property. These properties exists as both a Lookup property on the entity and an ActivytParty record.</field>
            },

            FetchXml: {
                Fetch: function (entity, count, page) {
                    /// <summary>Represents a FetchXml query object.</summary>
                    /// <param name="entity" type="MobileCRM.FetchXml.Entity">An entity object.</param>
                    /// <param name="count" type="int">the maximum number of records to retrieve.</param>
                    /// <param name="page" type="int">1-based index of the data page to retrieve.</param>
                    /// <field name="aggregate" type="Boolean">Indicates whether the fetch is aggregated.</field>
                    /// <field name="count" type="int">the maximum number of records to retrieve.</field>
                    /// <field name="entity" type="MobileCRM.FetchXml.Entity">An entity object.</field>
                    /// <field name="page" type="int">1-based index of the data page to retrieve.</field>
                    this.entity = entity;
                    this.count = count;
                    this.page = page;
                    this.aggregate = false;
                },
                Entity: function (name) {
                    /// <summary>Represents a FetchXml query root entity.</summary>
                    /// <param name="name" type="String">An entity logical name.</param>
                    /// <field name="attributes" type="Array">An array of <see cref="MobileCRM.FetchXml.Attribute">MobileCRM.FetchXml.Attribute</see> objects.</field>
                    /// <field name="filter" type="MobileCRM.FetchXml.Filter">A query filter.</field>
                    /// <field name="linkentities" type="Array">An array of <see cref="MobileCRM.FetchXml.LinkEntity">MobileCRM.FetchXml.LinkEntity</see> objects.</field>
                    /// <field name="name" type="String">An entity logical name.</field>
                    /// <field name="order" type="Array">An array of <see cref="MobileCRM.FetchXml.Order">MobileCRM.FetchXml.Order</see> objects.</field>
                    this.name = name;
                    this.attributes = [];
                    this.order = [];
                    this.filter = null;
                    this.linkentities = [];
                },
                LinkEntity: function (name) {
                    /// <summary>Represents a FetchXml query linked entity.</summary>
                    /// <remarks>This object is derived from <see cref="MobileCRM.FetchXml.Entity">MobileCRM.FetchXml.Entity</see></remarks>
                    /// <field name="alias" type="String">A link alias.</field>
                    /// <field name="from" type="String">The "from" field (if parent then target entity primary key).</field>
                    /// <field name="linkType" type="String">The link (join) type ("inner" or "outer").</field>
                    /// <param name="name" type="String">An entity name</param>
                    /// <field name="to" type="String">The "to" field.</field>
                    MobileCRM.FetchXml.LinkEntity.superproto.constructor.apply(this, arguments);

                    this.from = null;
                    this.to = null;
                    this.linktype = null;
                    this.alias = null;
                },
                Attribute: function (name) {
                    /// <summary>Represents a FetchXml select statement (CRM field).</summary>
                    /// <param name="name" type="String">A lower-case entity attribute name (CRM logical field name).</param>
                    /// <field name="aggregate" type="String">An aggregation function.</field>
                    /// <field name="alias" type="String">Defines an attribute alias.</field>
                    /// <field name="dategrouping" type="String">A date group by modifier (year, quarter, month, week, day).</field>
                    /// <field name="groupby" type="Boolean">Indicates whether to group by this attribute.</field>
                    /// <field name="name" type="String">A lower-case entity attribute name (CRM logical field name).</field>
                    this.name = name;
                    this.aggregate = null;
                    this.groupby = false;
                    this.alias = null;
                    this.dategrouping = null;
                },
                Order: function (attribute, descending) {
                    /// <summary>Represents a FetchXml order statement.</summary>
                    /// <param name="attribute" type="String">An attribute name (CRM logical field name).</param>
                    /// <param name="descending" type="Boolean">true, for descending order; false, for ascending order</param>
                    /// <field name="alias" type="String">Defines an order alias.</field>
                    /// <field name="attribute" type="String">An attribute name (CRM logical field name).</field>
                    /// <field name="descending" type="Boolean">true, for descending order; false, for ascending order.</field>
                    this.attribute = attribute;
                    this.alias = null;
                    this.descending = descending ? true : false;
                },
                Filter: function () {

                    /// <summary>Represents a FetchXml filter statement. A logical combination of <see cref="MobileCRM.FetchXml.Condition">Conditions</see> and child-filters.</summary>
                    /// <field name="conditions" type="Array">An array of <see cref="MobileCRM.FetchXml.Condition">Condition</see> objects.</field>
                    /// <field name="filters" type="Array">An array of <see cref="MobileCRM.FetchXml.Filter">Filter</see> objects representing child-filters.</field>
                    /// <field name="type" type="String">Defines the filter operator ("or" / "and").</field>
                    this.type = null;
                    this.conditions = [];
                    this.filters = [];
                },
                Condition: function () {
                    /// <summary>Represents a FetchXml attribute condition statement.</summary>
                    /// <field name="attribute" type="String">The attribute name (CRM logical field name).</field>
                    /// <field name="operator" type="String">The condition operator. "eq", "ne", "in", "not-in", "between", "not-between", "lt", "le", "gt", "ge", "like", "not-like", "null", "not-null", "eq-userid", "eq-userteams", "today", "yesterday", "tomorrow", "this-year", "last-week", "last-x-hours", "next-x-years", "olderthan-x-months", ...</field>
                    /// <field name="uiname" type="String">The lookup target entity display name.</field>
                    /// <field name="uitype" type="String">The lookup target entity logical name.</field>
                    /// <field name="value" type="">The value to compare to.</field>
                    /// <field name="values" type="Array">The list of values to compare to.</field>
                    this.attribute = null;
                    this.operator = null;
                    this.uitype = null;
                    this.uiname = null;
                    this.value = null;
                    this.values = [];
                }
            },

            Platform: function (props) {
                /// <summary>Represents object for querying platform specific information and executing platform integrated actions.</summary>
                /// <remarks>This object cannot be created directly. To obtain/modify this object, use <see cref="MobileCRM.Platform.requestObject">MobileCRM.Platform.requestObject</see> function.</remarks>
                /// <field name="capabilities" type="Number">Gets the mask of capability flags supported by this device (MakePhoneCalls=1; HasMapView=2).</field>
                /// <field name="deviceIdentifier" type="String">Gets the unique identifier of this device.</field>
                /// <field name="screenWidth" type="Number">Gets the current screen width in pixels.</field>
                /// <field name="screenHeight" type="Number">Gets the current screen width in pixels.</field>
                /// <field name="screenDensity" type="Number">Gets the screen density (DPI).</field>
                /// <field name="isMultiPanel" type="Boolean">Gets whether the device has tablet or phone UI.</field>
                /// <field name="customImagePath" type="String">Gets or sets the custom image path that comes from customization.</field>
                MobileCRM.Platform.superproto.constructor.apply(this, arguments);
            },

            Application: function () {
                /// <summary>Encapsulates the application-related functionality.</summary>
            },
            AboutInfo: function () {
                /// <summary>[v8.2] Represents the branding information.</summary>
                /// <field name="manufacturer" type="String">Gets the manufacturer text.</field>
                /// <field name="productTitle" type="String">Gets the product title text.</field>
                /// <field name="productTitleAndVersion" type="String">[v9.0] Gets the string with product title and version.</field>
                /// <field name="productSubTitle" type="String">Gets the product subtitle text.</field>
                /// <field name="poweredBy" type="String">Gets the powered by text.</field>
                /// <field name="icon" type="String">Gets the icon name.</field>
                /// <field name="website" type="String">Gets the website url.</field>
                /// <field name="supportEmail" type="String">Gets the support email.</field>
                this.manufacturer = "";
                this.productTitle = "";
                this.productTitleAndVersion = "";
                this.productSubTitle = "";
                this.poweredBy = "";
                this.icon = "";
                this.website = "";
                this.supportEmail = "";
            },
            MobileReport: function () {
                /// <summary>Provides a functionality of mobile reporting.</summary>
            },
            Questionnaire: function () {
                /// <summary>Provides a functionality for questionnaires.</summary>
            },
            UI: {
                FormManager: {
                },
                EntityForm: function (props) {
                    /// <summary>Represents the Javascript equivalent of native entity form object.</summary>
                    /// <remarks>This object cannot be created directly. To obtain/modify this object, use <see cref="MobileCRM.UI.EntityForm.requestObject">MobileCRM.UI.EntityForm.requestObject</see> function.</remarks>
                    /// <field name="associatedViews" type="Array">Gets the associated views as an array of <see cref="MobileCRM.UI._EntityList">MobileCRM.UI._EntityList</see> objects.</field>
                    /// <field name="canEdit" type="Boolean">Gets whether the form can be edited.</field>
                    /// <field name="canClose" type="Boolean">Determines if form can be closed, i.e. there are no unsaved data being edited.</field>
                    /// <field name="context" type="Object">Gets the specific context object for onChange and onSave handlers. The onChange context contains single property &quot;changedItem&quot; with the name of the changed detail item and the onSave context contains property &quot;errorMessage&quot; which can be used to break the save process with certain error message.</field>
                    /// <field name="controllers" type="Array">Gets the form controllers (map, web) as an array of <see cref="MobileCRM.UI._Controller">MobileCRM.UI._Controller</see> objects.</field>
                    /// <field name="detailViews" type="Array">Gets the detailView controls  as an array of <see cref="MobileCRM.UI._DetailView">MobileCRM.UI._DetailView</see> objects.</field>
                    /// <field name="entity" type="MobileCRM.DynamicEntity">Gets or sets the entity instance the form is showing.</field>
                    /// <field name="form" type="MobileCRM.UI.Form">Gets the top level form.</field>
                    /// <field name="iFrameOptions" type="Object">Carries the custom parameters that can be specified when opening the form using <see cref="MobileCRM.UI.FormManager">MobileCRM.UI.FormManager</see>.</field>
                    /// <field name="isDirty" type="Boolean">Indicates whether the form  has unsaved data.</field>
                    /// <field name="relationship" type="MobileCRM.Relationship">Defines relationship with parent entity.</field>
                    /// <field name="visible" type="Boolean">Gets whether the underlying form is visible.</field>
                    MobileCRM.UI.EntityForm.superproto.constructor.apply(this, arguments);
                },

                QuestionnaireForm: function () {
                    /// <summary>[v10.3] Represents the Javascript equivalent of native questionnaire form object.</summary>
                    /// <field name="form" type="MobileCRM.UI.Form">Gets the form which hosts the questionnaire.</field>
                    /// <field name="groups" type="MobileCRM.UI.QuestionnaireForm.Group[]">A list of <see cref="MobileCRM.UI.QuestionnaireForm.Group">QuestionnaireForm.Group</see> objects.</field>
                    /// <field name="questions" type="MobileCRM.UI.QuestionnaireForm.Question[]">A list of <see cref="MobileCRM.UI.QuestionnaireForm.Question">QuestionnaireForm.Question</see> objects.</field>
                    /// <field name="relationship" type="MobileCRM.Relationship">Gets the relation source and related entity. &quot;null&quot;, if there is no relationship.</field>
                    MobileCRM.UI.QuestionnaireForm.superproto.constructor.apply(this, arguments);
                },

                EntityList: function (props) {
                    /// <summary>[v9.2] Represents the Javascript equivalent of native entity list object.</summary>
                    /// <field name="allowAddExisting" type="Boolean">Gets or sets whether adding an existing entity is allowed.</field>
                    /// <field name="allowCreateNew" type="Boolean">Gets or sets whether create a new entity (or managing the N:N entities in the case of N:N list) is allowed.</field>
                    /// <field name="allowedDocActions" type="Number">Gets or sets a mask of document actions (for Note and Sharepoint document lists).</field>
                    /// <field name="allowSearch" type="Boolean">Gets or sets whether to show the search bar.</field>
                    /// <field name="autoWideWidth" type="String">Gets the view auto width pixel size.</field>
                    /// <field name="context" type="Object">[v10.0] Gets the specific context object for onChange, onSave and onCommand handlers.<p>The onSave context contains property &quot;entities&quot; with the list of all changed entities and property &quot;errorMessage&quot; which can be used to cancel the save process with certain error message.</p><p>The onChange handler context contains &quot;entities&quot; property with the list of currently changed entities (typically just one entity) and property &quot;propertyName&quot; with the field name that was changed.</p><p>Command handler context contains the &quot;cmdParam&quot; property and &quot;entities&quot; property with the list of currently selected entities.</p></field>
                    /// <field name="currentView" type="String">[v10.0] Gets currently selected entity list view.
                    /// <field name="entityName" type="String">Gets the name of the entities in this list.</field>
                    /// <field name="flipMode" type="Number">Gets or sets the flip configuration (which views to show and which one is the initial).</field>
                    /// <field name="hasMapViews" type="Boolean">Gets whether the list has a view that can be displayed on map.</field>
                    /// <field name="hasCalendarViews" type="Boolean">Gets or sets whether there is a view with &quot;CalendarFields&quot;.</field>
                    /// <field name="hasMoreButton" type="Boolean">Gets whether the list needs a more button.</field>
                    /// <field name="internalName" type="String">Gets the internal list name. Used for localization and image lookup.</field>
                    /// <field name="isDirty" type="Boolean">Gets or sets whether the list is dirty.</field>
                    /// <field name="isLoaded" type="Boolean">Gets or sets whether the list is loaded.</field>
                    /// <field name="isMultiSelect" type="Boolean">Gets whether multi selection is active.</field>
                    /// <field name="listButtons" type="Array">Gets the read-only array of strings defining the list buttons.</field>
                    /// <field name="listMode" type="Number">Gets the current list mode.</field>
                    /// <field name="listView" type="MobileCRM.UI._ListView">Gets the controlled listView control.</field>
                    /// <field name="lookupSource" type="MobileCRM.Relationship">Gets the lookup source. If the list is used for lookup this is the entity whose property is being &quot;looked-up&quot;.</field>
                    /// <field name="options" type="Number">Gets the kinds of views available on the list.</field>
                    /// <field name="relationship" type="MobileCRM.Relationship">Gets the relation source and related entity. &quot;null&quot;, if there is no relationship (if it is not an associated list).</field>
                    /// <field name="selectedEntity" type="MobileCRM.DynamicEntity">Gets currently selected entity. &quot;null&quot;, if there&apos;s no selection.</field>
                    /// <field name="uniqueName" type="Number">Gets or sets the unique name of the list. Used to save/load list specific settings.</field>
                    MobileCRM.UI.EntityList.superproto.constructor.apply(this, arguments);
                },

                HomeForm: function (props) {
                    /// <summary>[v8.0] Represents the Javascript equivalent of the home form object which contains the Home/UI replacement iFrame.</summary>
                    /// <remarks><p>This class works only from Home/UI replacement iFrame.</p><p>This object cannot be created directly. To obtain/modify this object, use <see cref="MobileCRM.UI.HomeForm.requestObject">MobileCRM.UI.HomeForm.requestObject</see> function.</p></remarks>
                    /// <field name="form" type="MobileCRM.UI.Form">Gets the top level form.</field>
                    /// <field name="items" type="Array">Gets the list of the home items.</field>
                    /// <field name="listView" type="MobileCRM.UI._ListController">Gets the list view with home items.</field>
                    /// <field name="lastSyncResult" type="MobileCRM.Services.SynchronizationResult">[v8.1] An object with last sync results. Contains following boolean properties: newCustomizationReady, customizationDownloaded, dataErrorsEncountered, appWasLocked, syncAborted, adminFullSync, wasBackgroundSync</field>
                    /// <field name="syncResultText" type="String">[v8.1] The last synchronization error text.</field>
                    /// <field name="syncProgress" type="Object">[v8.1] An object with current sync progress. Contains following properties: labels, percent. It is undefined if no sync is running.</field>
                    MobileCRM.UI.HomeForm.superproto.constructor.apply(this, arguments);
                },

                ReportForm: function () {
                    /// <summary>[v8.1] Represents the Dynamics CRM report form object.</summary>
                    /// <field name="allowedReportIds" type="Array">The list of report entity ids that has to be included in the report form selector.</field>
                    /// <field name="allowedLanguages" type="Array">The list of LCID codes of the languages that has to be included into the report form selector. The number -1 stands for "Any language".</field>
                    /// <field name="defaultReport" type="String">The primary name of the report entity that should be pre-selected on the report form.</field>
                    this.allowedReportIds = [];
                    this.allowedLanguages = [];
                    this.defaultReport = null;
                },

                IFrameForm: function () {
                    /// <summary>[v9.0] Represents the iFrame form object.</summary>
                    /// <field name="form" type="MobileCRM.UI.Form">Gets the form hosting the iFrame.</field>
                    /// <field name="isDirty" type="Boolean">[v10.0] Controls whether the form is dirty and requires save, or whether it can be closed.</field>
                    /// <field name="options" type="Object">Carries the custom parameters that can be specified when opening the form using <see cref="MobileCRM.UI.IFrameForm.show">MobileCRM.UI.IFrameForm.show</see> function.</field>
                    /// <field name="preventCloseMessage" type="String">[v9.3] Prevents closing the form if non-empty string is set. No other home-item can be opened and synchronization is not allowed to be started. Provided message is shown when user tries to perform those actions.</field>
                    /// <field name="saveBehavior" type="Number">[v10.0] Controls the behavior of the Save command on this form (0=Default, 1=SaveOnly, 2=SaveAndClose).</field>
                    MobileCRM.UI.IFrameForm.superproto.constructor.apply(this, arguments);
                },

                Form: function (props) {
                    /// <summary>[v8.0] Represents the Javascript equivalent of the form object.</summary>
                    /// <field name="canMaximize" type="Boolean">Gets or sets whether form can be maximized to fullscreen (full application frame).</field>
                    /// <field name="isMaximized" type="Boolean">Gets or sets whether form is currently maximized to fullscreen (full application frame).</field>
                    /// <field name="caption" type="String">Gets or sets the form caption.</field>
                    /// <field name="selectedViewIndex" type="Number">Gets or sets the selected view (tab) index.</field>
                    /// <field name="showTitle" type="Boolean">[v8.1] Determines whether the form caption bar should be visible.</field>
                    /// <field name="viewCount" type="Number">Gets the count of views in the form.</field>
                    /// <field name="visible" type="Boolean">Gets whether the form is visible.</field>
                    MobileCRM.UI.Form.superproto.constructor.apply(this, arguments);
                },

                ViewController: function () {
                    /// <summary>Represents the Javascript equivalent of view controller (map/web content).</summary>
                },

                ProcessController: function () {
                    /// <summary>[v8.2] Represents the Javascript equivalent of view process controller.</summary>
                    /// <remarks>It is not intended to create an instance of this class. To obtain this object, use <see cref="MobileCRM.UI.EntityForm.requestObject">EntityForm.requestObject</see> function and locate the controller in form&apos;s "controllers" list.</remarks>
                    /// <field name="currentStateInfo" type="Object">Gets the information about the current process flow state (active stage, visible stage and process).</field>
                    MobileCRM.UI.ProcessController.superproto.constructor.apply(this, arguments);
                },

                ViewDefinition: function () {
                    /// <summary>Represents the entity view definition.</summary>
                    /// <field name="entityName" type="String">Gets the entity this view is for.</field>
                    /// <field name="name" type="String">Gets the name of the view.</field>
                    /// <field name="fetch" type="String">Gets the fetchXml query.</field>
                    /// <field name="kind" type="Number">Gets the kind of the view (public, associated, etc.).</field>
                    /// <field name="version" type="Number">Gets the version.</field>
                    /// <field name="buttons" type="String">Gets the view buttons.</field>
                    /// <field name="selector" type="String">Gets the view template selector workflow.</field>
                    /// <field name="templates" type="Array">Gets the list templates.</summary>
                    /// <field name="entityLabel" type="String">Gets the entity label.</summary>
                },

                MessageBox: function (title, defaultText) {
                    /// <summary>This object allows the user to show a popup window and choose one of the actions.</summary>
                    /// <param name="title" type="string">The message box title.</param>
                    /// <param name="defaultText" type="string">The cancel button title text.</param>
                    /// <field name="items" type="Array">An array of button names.</field>
                    /// <field name="title" type="string">The message box title.</field>
                    /// <field name="defaultText" type="string">The cancel button title text.</field>
                    /// <field name="multiLine" type="Boolean">Indicates whether the message is multi line.</field>
                    var nArgs = arguments.length;
                    var arr = [];
                    for (var i = 2; i < nArgs; i++)
                        arr.push(arguments[i]);

                    this.title = title || null;
                    this.defaultText = defaultText || null;
                    this.multiLine = false;
                    this.items = arr;
                },

                LookupForm: function () {
                    /// <summary>This object allows user to select an entity from a configurable list of entity types.</summary>
                    /// <field name="entities" type="Array">An array of allowed entity kinds (schema names).</field>
                    /// <field name="allowedViews" type="String">OBSOLETE: Allowed views, or null if all are allowed.</field>
                    /// <field name="source" type="MobileCRM.Relationship">The entity whose property will be set to the chosen value.</field>
                    /// <field name="prevSelection" type="MobileCRM.Reference">The entity whose property will be set to the chosen value.</field>
                    /// <field name="allowNull" type="Boolean">Whether to allow selecting no entity.</field>
                    /// <field name="preventClose" type="Boolean">Whether to prevent closing form without choosing a value.</field>
                    var nEntities = arguments.length;
                    var arr = [];
                    for (var i = 0; i < nEntities; i++)
                        arr.push(arguments[i]);

                    this._views = [];
                    this.allowedViews = "";
                    this.entities = arr;
                    this.source = null;
                    this.prevSelection = null;
                    this.allowNull = false;
                    this.preventClose = false;
                },
                MultiLookupForm: function () {
                    /// <summary>[v9.3] This object allows user to select a list of entities from a configurable list of entity types. Derived from LookupForm so you can use the addView() and addEntityFilter() methods.</summary>
                    /// <field name="entities" type="Array">An array of allowed entity kinds (schema names).</field>
                    /// <field name="source" type="MobileCRM.Relationship">The entity whose property will be set to the chosen value.</field>
                    /// <field name="dataSource" type="MobileCRM.Reference[]">The list of entities that should be displayed as selected.</field>
                    /// <field name="prevSelection" type="MobileCRM.Reference">The entity whose property will be set to the chosen value.</field>
                    /// <field name="allowNull" type="Boolean">Whether to allow selecting no entity.</field>
                    /// <field name="preventClose" type="Boolean">Whether to prevent closing form without choosing a value.</field>
                    MobileCRM.UI.MultiLookupForm.superproto.constructor.apply(this, arguments);
                    this.dataSource = [];
                },
                TourplanForm: function (props) {
                    /// <summary>Represents the Javascript equivalent tourplan form object.</summary>
                    /// <remarks>This object cannot be created directly. To obtain/modify this object, use <see cref="MobileCRM.UI.TourplanForm.requestObject">MobileCRM.UI.TourplanForm.requestObject</see> function.</remarks>
                    /// <field name="isDirty" type="Boolean">Indicates whether the form has been modified.</field>
                    /// <field name="isLoaded" type="Boolean">Gets or sets whether the form is loaded.</field>
                    /// <field name="view" type="MobileCRM.UI._AppointmentView">Gets tourplan form view <see cref="MobileCRM.UI._AppointmentView">MobileCRM.UI.AppointmentView</see>.</field>
                    MobileCRM.UI.TourplanForm.superproto.constructor.apply(this, arguments);
                },

                _DetailView: function (props) {
                    /// <summary>Represents the Javascript equivalent of detail view with set of items responsible for fields editing.</summary>
                    /// <field name="isDirty" type="Boolean">Indicates whether the value of an item has been modified.</field>
                    /// <field name="isEnabled" type="Boolean">Gets or sets whether the all items are enabled or disabled.</field>
                    /// <field name="isVisible" type="Boolean">Gets or sets whether the view is visible.</field>
                    /// <field name="items" type="Array">An array of <see cref="MobileCRM.UI._DetailItem">MobileCRM.UI._DetailItem</see> objects</field>
                    /// <field name="name" type="String">Gets the name of the view</field>
                    MobileCRM.UI._DetailView.superproto.constructor.apply(this, arguments);
                },
                DetailViewItems: {
                    Item: function (name, label) {
                        /// <summary>[8.0] Represents the <see cref="MobileCRM.UI._DetailView"></see> item.</summary>
                        /// <param name="name" type="String">Defines the item name.</param>
                        /// <param name="label" type="String">Defines the item label.</param>
                        /// <field name="name" type="String">Gets or sets the item name.</field>
                        /// <field name="label" type="String">Gets or sets the item label.</field>
                        /// <field name="dataMember" type="String">Gets or sets the name of the property containing the item value in data source objects.</field>
                        /// <field name="errorMessage" type="String">Gets or sets the item error message.</field>
                        /// <field name="isEnabled" type="Boolean">Gets or sets whether the item is editable.</field>
                        /// <field name="isVisible" type="Boolean">Gets or sets whether the item is visible.</field>
                        /// <field name="value" type="Object">Gets or sets the bound item value.</field>
                        /// <field name="isNullable" type="Boolean">Gets or sets whether the item value can be &quot;null&quot;.</field>
                        /// <field name="validate" type="Boolean">Gets or sets whether the item needs validation.</field>
                        /// <field name="style" type="String">The name of the Woodford item style.</field>
                        this._type = null;
                        this.name = name;
                        this.label = label;
                    },
                    SeparatorItem: function (name, label) {
                        /// <summary>[8.0] Represents the <see cref="MobileCRM.UI._DetailView"></see> separator item.</summary>
                        /// <param name="name" type="String">Defines the item name.</param>
                        /// <param name="label" type="String">Defines the item label.</param>
                        MobileCRM.UI.DetailViewItems.SeparatorItem.superproto.constructor.apply(this, arguments);
                        this._type = "Separator";
                    },
                    TextBoxItem: function (name, label) {
                        /// <summary>[8.0] Represents the <see cref="MobileCRM.UI._DetailView"></see> text item.</summary>
                        /// <param name="name" type="String">Defines the item name.</param>
                        /// <param name="label" type="String">Defines the item label.</param>
                        /// <field name="numberOfLines" type="Number">Gets or sets the number of lines to display. Default is one.</field>
                        /// <field name="isPassword" type="Boolean">Gets or sets whether the text value should be masked. Used for password entry.</field>
                        /// <field name="maxLength" type="Number">Gets to sets the maximum text length.</field>
                        /// <field name="kind" type="Number">Gets or sets the value kind (Text=0, Email=1, Url=2, Phone=3, Barcode=4).</field>
                        /// <field name="placeholderText" type="Number">Gets or sets the text that is displayed in the control until the value is changed by a user action or some other operation. Default is empty string.</field>
                        MobileCRM.UI.DetailViewItems.TextBoxItem.superproto.constructor.apply(this, arguments);
                        this._type = "TextBox";
                    },
                    NumericItem: function (name, label) {
                        /// <summary>[8.0] Represents the <see cref="MobileCRM.UI._DetailView"></see> numeric item.</summary>
                        /// <param name="name" type="String">Defines the item name.</param>
                        /// <param name="label" type="String">Defines the item label.</param>
                        /// <field name="minimum" type="Number">Gets or sets the minimum allowed value.</field>
                        /// <field name="maximum" type="Number">Gets or sets the maximum allowed value.</field>
                        /// <field name="increment" type="Number">Gets or sets the increment (if the upDownVisible is true).</field>
                        /// <field name="upDownVisible" type="Boolean">Gets or sets whether the up/down control is visible.</field>
                        /// <field name="decimalPlaces" type="Number">Gets or sets the number of decimal places.</field>
                        /// <field name="displayFormat" type="String">Gets or sets the value format string.</field>
                        MobileCRM.UI.DetailViewItems.NumericItem.superproto.constructor.apply(this, arguments);
                        this._type = "Numeric";
                        //this.minimum = 0;
                        //this.maximum = 0;
                        //this.increment = 1;
                        //this.upDownVisible = false;
                        //this.decimalPlaces = 2;
                        //this.displayFormat = "";
                    },
                    CheckBoxItem: function (name, label) {
                        /// <summary>[8.0] Represents the <see cref="MobileCRM.UI._DetailView"></see> checkbox item.</summary>
                        /// <param name="name" type="String">Defines the item name.</param>
                        /// <param name="label" type="String">Defines the item label.</param>
                        /// <field name="textChecked" type="String">Gets or sets the text for checked state.</field>
                        /// <field name="textUnchecked" type="String">Gets or sets the text for unchecked state.</field>
                        MobileCRM.UI.DetailViewItems.CheckBoxItem.superproto.constructor.apply(this, arguments);
                        this._type = "CheckBox";
                        this.isNullable = false;
                    },
                    DateTimeItem: function (name, label) {
                        /// <summary>[8.0] Represents the <see cref="MobileCRM.UI._DetailView"></see> date/time item.</summary>
                        /// <param name="name" type="String">Defines the item name.</param>
                        /// <param name="label" type="String">Defines the item label.</param>
                        /// <field name="minimum" type="Date">Gets or sets the minimum allowed value.</field>
                        /// <field name="maximum" type="Date">Gets or sets the maximum allowed value.</field>
                        /// <field name="parts" type="Number"> Gets or sets whether to display and edit the date, time or both.</field>
                        MobileCRM.UI.DetailViewItems.DateTimeItem.superproto.constructor.apply(this, arguments);
                        this._type = "DateTime";
                    },
                    DurationItem: function (name, label) {
                        /// <summary>[8.0] Represents the <see cref="MobileCRM.UI._DetailView"></see> duration item.</summary>
                        /// <param name="name" type="String">Defines the item name.</param>
                        /// <param name="label" type="String">Defines the item label.</param>
                        MobileCRM.UI.DetailViewItems.DurationItem.superproto.constructor.apply(this, arguments);
                        this._type = "Duration";
                    },
                    ComboBoxItem: function (name, label) {
                        /// <summary>[8.0] Represents the <see cref="MobileCRM.UI._DetailView"></see> combobox item.</summary>
                        /// <param name="name" type="String">Defines the item name.</param>
                        /// <param name="label" type="String">Defines the item label.</param>
                        /// <field name="listDataSource" type="Object">Gets or sets the object with props and values to be displayed in the combo list (e.g. {&quot;label1&quot;:1, &quot;label2&quot;:2}).</field>
                        /// <field name="listDataSourceValueType" type="String">Type of list data source element value. Default is string, allowed int, string.</param></param>
                        MobileCRM.UI.DetailViewItems.ComboBoxItem.superproto.constructor.apply(this, arguments);
                        this._type = "ComboBox";
                    },
                    LinkItem: function (name, label, listDropDownFormat) {
                        /// <summary>[8.0] Represents the <see cref="MobileCRM.UI._DetailView"></see> link item.</summary>
                        /// <param name="name" type="String">Defines the item name.</param>
                        /// <param name="label" type="String">Defines the item label.</param>
                        /// <param name="listDropDownFormat" type="MobileCRM.UI.DetailViewItems.DropDownFormat">Defines item&apos;s drop down format.</param>
                        /// <field name="isMultiLine" type="Boolean">Gets or sets whether the item is multiline. Default is false.</field>
                        MobileCRM.UI.DetailViewItems.LinkItem.superproto.constructor.apply(this, arguments);
                        this._type = "Link";
                        if (listDropDownFormat)
                            this.listDropDownFormat = listDropDownFormat;
                    },
                    DropDownFormat: {
                        StringList: 17,
                        StringListInput: 18,
                        MultiStringList: 19,
                        MultiStringListInput: 20
                    },
                },

                MediaTab: function (index, name) {
                    /// <summary>Represents the MediaTab controller.</summary>
                    /// <remarks>An instance of this class can only be obtained by calling the <see cref="MobileCRM.UI.EntityForm.getMediaTab">MobileCRM.UI.EntityForm.getMediaTab</see> method.</remarks>
                    /// <param name="index" type="Number">The index of an associated media tab.</param>
                    /// <param name="name" type="String">The name of an associated media tab.</param>

                    this.index = index;
                    this.name = name;
                }
            },
            Services: {
                FileInfo: function (filePath, url, mimeType, nextInfo) {
                    /// <summary>Carries the result of a DocumentService operation.</summary>
                    /// <remarks>In case of canceled document service operation, all properties in this object will be set to &quot;null&quot;.</remarks>
                    /// <field name="filePath" type="String">Gets the full path of the local file.</field>
                    /// <field name="url" type="String">Gets the local URL of the file which can be used from within this HTML document.</field>
                    /// <field name="mimeType" type="String">Gets the file MIME type.</field>
                    /// <field name="nextInfo" type="MobileCRM.Services.FileInfo">Gets the next file info or &quot;null&quot;.</field>
                    this.filePath = filePath;
                    this.url = url;
                    this.mimeType = mimeType;
                    this.nextInfo = nextInfo || null;
                },
                ChatService: function () {
                    /// <summary>[v9.3] Represents a service for sending instant messages to users or shared channels.</summary>
                    /// <remarks>Instance of this object cannot be created directly. Use <see cref="MobileCRM.Services.ChatService.getService">MobileCRM.Services.ChatService.getService</see> to create new instance.</remarks>
                    /// <field name="chatUser" type="MobileCRM.DynamicEntity">An instance of the resco_chatuser entity for current user (either system or external).</field>
                    /// <field name="userEntity" type="String">The user entity name (either systemuser or external user entity name).</field>
                    /// <field name="userId" type="String">Primary key (id) of the current user (either system or external).</field>
                    MobileCRM.Services.ChatService.superproto.constructor.apply(this, arguments);
                },
                DocumentService: function () {
                    /// <summary>[v8.1] Represents a service for acquiring the documents.</summary>
                    /// <field name="maxImageSize" type="Number">Gets or sets the maximum captured image size. If captured image size is greater, the image is resized to specified maximum size.</field>
                    /// <field name="recordQuality" type="Number">Gets or sets the record quality for audio/video recordings.</field>
                    /// <field name="allowChooseVideo" type="Boolean">Indicates whether the video files should be included into the image picker when selecting the photos. The default is true.</field>
                    /// <field name="allowMultipleFiles" type="Boolean">Indicates whether to allow multiple files for DocumentActions SelectPhoto and SelectFile.[Not implemented on iOS.]</field>
                },
                AudioRecorder: function () {
                    /// <summary>[v10.0] Represents a service for recording an audio.</summary>
                },
                AddressBookService: function () {
                    /// <summary>[v9.1] Represents a service for accessing the address book.</summary>
                },
                DynamicsReport: function (reportId, regarding) {
                    /// <summary>[v10.0] Represents a service for downloading MS Dynamics reports.</summary>
                    /// <param name="reportId" type="String">ID of the &quot;report&quot; entity record.<param>
                    /// <param name="regarding" type="MobileCRM.Reference">Regarding entity reference.<param>
                    /// <field name="reportId" type="String">ID of the &quot;report&quot; entity record.<field>
                    /// <field name="regarding" type="MobileCRM.Reference">Regarding entity reference.<field>
                    /// <field name="outputFolder" type="String">AppData-relative or absolute path to the output folder where the file should be stored. Leave undefined to put them into platform-specific temporary folder.<field>
                    this.reportId = reportId;
                    this.regarding = regarding;
                    this.outputFolder = null;
                },
                HttpWebRequest: function () {
                    /// <summary>[v11.0] Instance of http web request.</summary>
                    /// <field name="userName" type="String">The authentication user name.</field>
                    /// <field name="password" type="name="password" type="String">The authentication password.</field>
                    /// <field name="method" type="String">The http method to use for the request (e.g. "POST", "GET", "PUT").</field>
                    /// <field name="headers" type="Object">An object of additional header key/value pairs to send along with requests using the HttpWebRequest.</field>
                    /// <field name="contentType" type="String">The htt request data content type.</field>
                    /// <field name="allowRedirect" type="Boolean">The http allows servers to redirect a client request to a different location.</field>
                    /// <field name="responseEncoding" type="String">The http web response encoding type. (default: UTF-8), e.g. Base64, ASCII, UTF-8, Binary in case of blob.</field>
                    /// <field name="responseType" type="String">The HttpWebResponse content type.</field>

                    this.userName = "";
                    this.password = "";
                    this.method = "";
                    this.headers = {};
                    this.contentType = null;
                    this.allowRedirect = false;
                    this._body = null;
                    this._encoding = "UTF-8";
                    this._credentials = {};
                    this.responseType = null;
                    this.responseEncoding = this._encoding;
                },
                SynchronizationResult: function (syncResult) {
                    /// <summary>[v8.1] Represents the synchronization result.</summary>
                    /// <field name="newCustomizationReady" type="Boolean">Indicates whether the new customization is ready.</field>
                    /// <field name="customizationDownloaded" type="Boolean">Indicates whether the new customization was applied.</field>
                    /// <field name="dataErrorsEncountered" type="Boolean">Indicates whether some data errors were encountered during sync (cannot upload, delete, change status, owner, etc.).</field>
                    /// <field name="appWasLocked" type="Boolean">Application was locked.</field>
                    /// <field name="syncAborted" type="Boolean">Sync was aborted.</field>
                    /// <field name="adminFullSync" type="Boolean">Full sync was requested so background sync was aborted.</field>
                    /// <field name="webError" type="Boolean">Indicates whether sync failed due to a communication error (HttpException, for example).</field>
                    /// <field name="connectFailed" type="Boolean">Indicates whether sync could not start because of a connection failure.</field>
                    /// <field name="wasBackgroundSync" type="Boolean">Indicates whether the last sync was background sync or foreground sync.</field>

                    if (typeof (syncResult) != "undefined") {
                        var res = new Number(syncResult);
                        this.newCustomizationReady = (res & 1) != 0;
                        this.customizationDownloaded = (res & 2) != 0;
                        this.dataErrorsEncountered = (res & 8) != 0;
                        this.appWasLocked = (res & 16) != 0;
                        this.syncAborted = (res & 32) != 0;
                        this.adminFullSync = (res & 64) != 0;
                        this.webError = (res & 128) != 0,
                            this.connectFailed = (res & 256) != 0,
                            this.wasBackgroundSync = (res & 0x80000000) != 0;
                    }
                },
                GeoAddress: function () {
                    /// <summary>[v9.3] Represents a service for translating geo position into the civic address and back.</summary>
                    /// <field name="streetNumber" type="String">Gets or sets the street number.</field>
                    /// <field name="street" type="String">Gets or sets the street.</field>
                    /// <field name="city" type="String">Gets or sets the city.</field>
                    /// <field name="zip" type="String">Gets or sets the zip code.</field>
                    /// <field name="stateOrProvince" type="String">Gets or sets the state or province.</field>
                    /// <field name="country" type="String">Gets or sets the country.</field>
                    /// <field name="isValid" type="String">Indicates whether the address is valid.</field>
                }
            }
        };

        /************************/
        // Prototypes & Statics //
        /************************/
        // MobileCRM.UI._MediaTab
        MobileCRM.UI.MediaTab.prototype._onCommand = function (commandIndex, errorCallback) {
            /// <summary>Executes the MediaTab command by index.</summary>
            /// <param name="commandIndex" type="Number">Specifies the command index.</param>
            ///	<param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            var mediaTab = MobileCRM.bridge.exposeObjectAsync("EntityForm.Controllers.get_Item", [this.index]);
            mediaTab.invokeMethodAsync("View.ExecuteAction", [commandIndex], function () { }, errorCallback);
            mediaTab.release();
        };
        MobileCRM.UI.MediaTab.prototype.setEditable = function (editable, errorCallback) {
            /// <summary>[v11.1] Marks the MediaTab as editable.</summary>
            /// <param name="editable" type="Boolean">Indicates whether to mark MediaTab as editable.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            var mediaTab = MobileCRM.bridge.exposeObjectAsync("EntityForm.Controllers.get_Item", [this.index]);
            mediaTab.invokeMethodAsync("set_IsEditable", [editable], function () { }, errorCallback);
            mediaTab.release();
        };
        MobileCRM.UI.MediaTab.prototype.setCommandsMask = function (commandMask, errorCallback) {
            /// <summary>[v11.1] Sets the mask of allowed document actions.</summary>
            /// <param name="commandMask" type="Number">Specifies the mask of allowed commands.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            var mediaTab = MobileCRM.bridge.exposeObjectAsync("EntityForm.Controllers.get_Item", [this.index]);
            mediaTab.invokeMethodAsync("set_CommandsMask", [commandMask], function () { }, errorCallback);
            mediaTab.release();
        };
        MobileCRM.AboutInfo.requestObject = function (callback, errorCallback, scope) {
            /// <summary>[v8.2] Asynchronously gets the AboutInfo object with branding information.</summary>
            /// <param name="callback" type="function(Object)">The callback function that is called asynchronously with the about info object.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            MobileCRM.bridge.invokeStaticMethodAsync("MobileCrm", "MobileCrm.Controllers.AboutForm", "LoadAboutInfo", [], function (res) {
                var aboutInfo = new MobileCRM.AboutInfo();
                for (var property in res) {
                    if (aboutInfo.hasOwnProperty(property))
                        aboutInfo[property] = res[property];
                }
                callback.call(scope, aboutInfo);
            }, errorCallback, scope);
        };
        MobileCRM.UI.MediaTab.prototype.capturePhoto = function (errorCallback) {
            /// <summary>Captures photo on this media tab.</summary>
            this._onCommand(2, errorCallback);
        };
        MobileCRM.UI.MediaTab.prototype.selectPhoto = function (errorCallback) {
            /// <summary>Executes the select photo command on this media tab.</summary>
            this._onCommand(4, errorCallback);
        };
        MobileCRM.UI.MediaTab.prototype.selectFile = function (errorCallback) {
            /// <summary>Executes the select file command on this media tab.</summary>
            this._onCommand(8, errorCallback);
        };
        MobileCRM.UI.MediaTab.prototype.recordAudio = function (errorCallback) {
            /// <summary>Executes the record audio command on this media tab.</summary>
            this._onCommand(16, errorCallback);
        };
        MobileCRM.UI.MediaTab.prototype.recordVideo = function (errorCallback) {
            /// <summary>Executes the record video command on this media tab.</summary>
            this._onCommand(32, errorCallback);
        };
        MobileCRM.UI.MediaTab.prototype.clear = function (errorCallback) {
            /// <summary>Clears the content of this media tab.</summary>
            this._onCommand(0x1000, errorCallback);
        };
        MobileCRM.UI.MediaTab.prototype.open = function (errorCallback) {
            /// <summary>Opens the loaded document in a external application. Which application is platform specific.</summary>
            this._onCommand(0x4000, errorCallback);
        }
        MobileCRM.UI.MediaTab.prototype.export = function (errorCallback) {
            /// <summary>Saves to file to disk.</summary>
            this._onCommand(0x8000000, errorCallback);
        }
        MobileCRM.UI.MediaTab.prototype.print = function (errorCallback) {
            /// <summary>Prints the document.</summary>
            this._onCommand(0x80000, errorCallback);
        }
        MobileCRM.UI.MediaTab.prototype.getDocumentInfo = function (callback, errorCallback, scope) {
            /// <summary>[v8.0.1] Asynchronously gets the media tab view object.</summary>
            /// <param name="callback" type="function(Object)">The callback function that is called asynchronously with the document info object.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            var mediaTab = MobileCRM.bridge.exposeObjectAsync("EntityForm.Controllers.get_Item", [this.index]);
            mediaTab.invokeMethodAsync("get_View", [], callback, errorCallback, scope);
            mediaTab.release();
        };
        MobileCRM.UI.MediaTab.prototype.getData = function (callback, errorCallback, scope) {
            /// <summary>[v8.0] Gets the media tab document in form of base64 string.</summary>
            /// <param name="callback" type="function(String)">The callback function that is called asynchronously with the base64-encoded document data.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.command("getViewData", this.name, callback, errorCallback, scope);
        };
        MobileCRM.UI.MediaTab.getData = function (viewName, callback, errorCallback, scope) {
            /// <summary>[v8.0] Gets the media tab document in form of base64 string.</summary>
            /// <param name="viewName" type="String">The name of the media tab.</param>
            /// <param name="callback" type="function(String)">The callback function that is called asynchronously with the base64-encoded document data.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.command("getViewData", viewName, callback, errorCallback, scope);
        };
        MobileCRM.UI.MediaTab.prototype.isEmpty = function (callback, errorCallback, scope) {
            /// <summary>[v9.0.2] Asynchronously gets the boolean value indicating whether the media tab content is empty or not.</summary>
            /// <param name="callback" type="function(Boolean)">The callback function that is called asynchronously with the boolean value indicating whether the content is empty or not.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            var mediaTab = MobileCRM.bridge.exposeObjectAsync("EntityForm.Controllers.get_Item", [this.index]);
            mediaTab.invokeMethodAsync("get_IsEmpty", [], callback, errorCallback, scope);
            mediaTab.release();
        };
        MobileCRM.UI.MediaTab.prototype.getNoteSubject = function (callback, errorCallback, scope) {
            /// <summary>[v10.1] Asynchronously gets the subject text of the note loaded on the media tab.</summary>
            /// <param name="callback" type="function(String)">The callback function that is called asynchronously with the media tab note subject.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            var mediaTab = MobileCRM.bridge.exposeObjectAsync("EntityForm.Controllers.get_Item", [this.index]);
            mediaTab.invokeMethodAsync("get_NoteSubject", [], callback, errorCallback, scope);
            mediaTab.release();
        };
        MobileCRM.UI.MediaTab.prototype.setNoteSubject = function (subject, errorCallback, scope) {
            /// <summary>[v10.1] Asynchronously sets the name of the note to load (and save).</summary>
            /// <param name="subject" type="String">The name of the note to load (and save).</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            var mediaTab = MobileCRM.bridge.exposeObjectAsync("EntityForm.Controllers.get_Item", [this.index]);
            mediaTab.invokeMethodAsync("set_NoteSubject", [subject], function () { }, errorCallback, scope);
            mediaTab.release();
        };

        // MobileCRM.Bridge
        MobileCRM.Bridge.prototype._createCmdObject = function (success, failed, scope) {
            var self = MobileCRM.bridge;
            var cmdId = 'Cmd' + self.callbackId++;
            self.callbacks[cmdId] = { SuccessFn: success, FailedFn: failed, Scope: scope };
            return cmdId;
        };

        MobileCRM.Bridge.prototype.requestObject = function (objectName, callback, errorCallback, scope) {
            /// <summary>Requests the managed application object.</summary>
            /// <remarks>Method initiates an asynchronous request which either ends with calling the <b>errorCallback</b> or with calling the <b>callback</b> with JSON representation of requested object. Requested object must be exposed by application. The list of exposed objects can be found in JSBridge Guide.</remarks>
            /// <param name="objectName" type="String">The name of exposed managed object as it was registered on application side.</param>
            /// <param name="callback" type="function(obj)">The callback function that is called asynchronously with JSON-serialized <see cref="MobileCRM.ObservableObject">MobileCRM.ObservableObject</see> <b>obj</b> as argument. Callback must return the object clone with changed properties (see <see cref="MobileCRM.ObservableObject.getChanged">getChanged</see> method). Returned object is passed back to application and its properties are applied back on requested object.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called asynchronously in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.command("requestObj", objectName, callback, errorCallback, scope);
        }
        MobileCRM.Bridge.prototype.initialize = function () {
            /// <summary>Initializes the bridge to be used for synchronous invokes.</summary>
        }
	    /* Following methods are no longer supported (they are no longer implemented on iOS)
		MobileCRM.Bridge.prototype.invokeMethod = function (objectName, method) {
			/// <summary>Synchronously invokes a method on exposed managed object and returns the result.</summary>
			/// <remarks><p>WARNING: This function is in experimental stage and can cause a deadlock if invoked C# method calls back to Javascript. Its usage must be tested on all platforms.</p><p>Before calling this method for the first time, it is necessary to initialize the bridge by calling <see cref="MobileCRM.Bridge.initialize">initialize</see> method.</p></remarks>
			/// <param name="objectName" type="String">The name of exposed managed object as it was registered on application side.</param>
			/// <param name="method" type="String">The name of the method implemented by object class.</param>
			var params = [];
			var i = 2;
			while (arguments[i])
				params.push(arguments[i++]);
			return MobileCRM.bridge.invoke("invokeMethod", objectName + "." + method + JSON.stringify(params));
		}
		MobileCRM.Bridge.prototype.invokeStaticMethod = function (assembly, typeName, method) {
			/// <summary>Synchronously invokes a static method on specified type and returns the result.</summary>
			/// <remarks><p>WARNING: This function is in experimental stage and can cause a deadlock if invoked C# method calls back to Javascript. Its usage must be tested on all platforms.</p><p>Before calling this method for the first time, it is necessary to initialize the bridge by calling <see cref="MobileCRM.Bridge.initialize">initialize</see> method.</p></remarks>
			/// <param name="assembly" type="String">The name of the assembly which defines the type.</param>
			/// <param name="typeName" type="String">The full name of the C# type which implements the method.</param>
			/// <param name="method" type="String">The name of static method to be invoked.</param>
			var params = [];
			var i = 3;
			while (arguments[i])
				params.push(arguments[i++]);
			return MobileCRM.bridge.invoke("invokeMethod", (assembly ? (assembly + ":") : "") + typeName + "." + method + JSON.stringify(params));
		}
		MobileCRM.Bridge.prototype.getPropertyValue = function (objectName, property) {
			/// <summary>Synchronously invokes a property getter on exposed managed object and returns the result.</summary>
			/// <param name="objectName" type="String">The name of exposed managed object as it was registered on application side.</param>
			/// <param name="property" type="String">The name of the property.</param>
			return MobileCRM.bridge.invokeMethod(objectName, "get_" + property);
		}
		MobileCRM.Bridge.prototype.setPropertyValue = function (objectName, property, value) {
			/// <summary>Synchronously invokes a property setter on exposed managed object.</summary>
			/// <param name="objectName" type="String">The name of exposed managed object as it was registered on application side.</param>
			/// <param name="property" type="String">The name of the property.</param>
			/// <param name="value" type="">A value being set into property.</param>
			return MobileCRM.bridge.invokeMethod(objectName, "set_" + property, value);
		}*/
        MobileCRM.Bridge.prototype.invokeMethodAsync = function (objectName, method, paramsList, callback, errorCallback, scope) {
            /// <summary>Invokes a method on exposed managed object and returns the result asynchronously via callback.</summary>
            /// <param name="objectName" type="String">The name of exposed managed object as it was registered on C# side (IJavascriptBridge.ExposeObject).</param>
            /// <param name="method" type="String">The name of the method implemented by object class.</param>
            /// <param name="paramsList" type="Array">An array with parameters that should be passed to a method.</param>
            /// <param name="callback" type="function(obj)">The callback function that is called asynchronously with JSON-serialized return value. It is either generic type or <see cref="MobileCRM.ObservableObject">MobileCRM.ObservableObject</see> with JSON-serialized return value.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called asynchronously in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            return MobileCRM.bridge.command("invokeMethod", objectName + "." + method + JSON.stringify(paramsList), callback, errorCallback, scope);
        }
        MobileCRM.Bridge.prototype.invokeStaticMethodAsync = function (assembly, typeName, method, paramsList, callback, errorCallback, scope) {
            /// <summary>Invokes a static method on specified type and returns the result asynchronously via callback.</summary>
            /// <param name="assembly" type="String">The name of the assembly which defines the type.</param>
            /// <param name="typeName" type="String">The full name of the C# type which implements the method.</param>
            /// <param name="method" type="String">The name of static method to be invoked.</param>
            /// <param name="paramsList" type="Array">An array with parameters that should be passed to a method.</param>
            /// <param name="callback" type="function(obj)">The callback function that is called asynchronously with JSON-serialized return value. It is either generic type or <see cref="MobileCRM.ObservableObject">MobileCRM.ObservableObject</see> with JSON-serialized return value.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called asynchronously in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            return MobileCRM.bridge.command("invokeMethod", (assembly ? (assembly + ":") : "") + typeName + "." + method + JSON.stringify(paramsList), callback, errorCallback, scope);
        }

        var _tmpObjId = 0;
        MobileCRM.Bridge.prototype.exposeObjectAsync = function (method, paramsList) {
            /// <summary>Exposes the managed object which is the result of the method call.</summary>
            /// <param name="method" type="String">The name of the method implemented by object class.</param>
            /// <param name="paramsList" type="Array">An array with parameters that should be passed to a method.</param>
            /// <returns type="MobileCRM.ExposedObject">The Javascript placeholder object for exposed managed object.</returns>
            var objId = ++_tmpObjId;
            MobileCRM.bridge.command("exposeMethodResult", objId + "#" + method + JSON.stringify(paramsList));
            return new MobileCRM.ExposedObject(objId);
        }

        MobileCRM.Bridge.prototype.raiseGlobalEvent = function (eventName, args) {
            /// <summary>[v9.0] Raises the global event which can have listeners bound by other iFrames.</summary>
            /// <param name="eventName" type="String">Global event name.</param>
            /// <param name="args" type="Object">Any object that has to be passed to all event listeners. This object is stringified JSON and passed to another iFrame listening on the global event.</param>
            this.invokeStaticMethodAsync("MobileCrm.UI", "MobileCrm.UI.Controllers.WebController", "RaiseGlobalEvent", [eventName, JSON.stringify(args)]);
        }

        var _globalHandlers = {};

        MobileCRM.Bridge.prototype.onGlobalEvent = function (eventName, handler, bind, scope) {
            /// <summary>[v9.0] Binds or unbinds the handler for global event.</summary>
            /// <remarks><p>This methods binds or unbinds a handler which is called when this or other iFrame raises the specified event by calling the <see cref="MobileCRM.Bridge.raiseGlobalEvent">MobileCRM.bridge.raiseGlobalEvent</see> method.</p><p>It can also bind a handler for pre-defined events EntityFormClosed, IFrameFormClosed, SyncStarted and SyncFinished.</p></remarks>
            /// <param name="eventName" type="String">Global event name.</param>
            /// <param name="handler" type="function(args)">The handler function that has to be bound or unbound.</param>
            /// <param name="bind" type="Boolean">Determines whether to bind or unbind the handler.</param>
            /// <param name="scope" type="Object">The scope for handler calls.</param>
            var handlers = _globalHandlers[eventName];
            if (handlers === undefined) {
                _globalHandlers[eventName] = handlers = [];
            }
            var register = handlers.length == 0;
            _bindHandler(handler, handlers, bind, scope);
            if (bind) {
                if (register)
                    MobileCRM.bridge.command("registerGlobalEvent", "+" + eventName);
            }
            else if (handlers.length == 0)
                MobileCRM.bridge.command("registerGlobalEvent", "-" + eventName);
        };

        MobileCRM.Bridge.prototype._callGlobalHandlers = function (event, data) {
            var handlers = _globalHandlers[event];
            if (handlers && handlers.length > 0) {
                return _callHandlers(handlers, data);
            }
            return null;
        }

        MobileCRM.Bridge.prototype.runCallback = function (id, response) {
            /// <summary>Internal method which is called from Mobile CRM application to run a command callback.</summary>
            /// <param name="id" type="String">A command ID</param>
            /// <param name="response" type="String">A string containing the JSON response</param>
            try {
                var callback = MobileCRM.bridge.callbacks[id];
                if (callback) {
                    var result = null;
                    if (callback.SuccessFn) {
                        result = callback.SuccessFn.call(callback.Scope, response);
                        // Forget SuccessFn not to be called anymore
                        delete callback.SuccessFn;
                    }
                    return JSON.stringify(result);
                }
                return "Err: callback not found";
            } catch (exception) {
                return 'Err:' + exception.message;
            }
        };
        MobileCRM.Bridge.prototype.setResponse = function (id, response, deleteCallback) {
            /// <summary>Internal method which is called from Mobile CRM application in case of successfully processed command.</summary>
            /// <param name="id" type="String">A command ID</param>
            /// <param name="response" type="String">A string containing the JSON response</param>
            try {
                var self = MobileCRM.bridge;
                var callback = self.callbacks[id];
                if (callback) {
                    if (callback.SuccessFn) {
                        callback.SuccessFn.call(callback.Scope, response);
                    }
                    if (deleteCallback != false)
                        delete self.callbacks[id];
                }
            } catch (exception) {
                return exception.message;
            }
            return "OK";
        };
        MobileCRM.Bridge.prototype.setError = function (id, error) {
            /// <summary>Internal method which is called from Mobile CRM application in case of command processing failure.</summary>
            /// <param name="id" type="String">A command ID</param>
            /// <param name="response" type="String">A string containing the error message</param>
            var self = MobileCRM.bridge;
            var callback = self.callbacks[id];
            if (callback) {
                if (callback.FailedFn) {
                    callback.FailedFn.call(callback.Scope, error);
                }
                delete self.callbacks[id];
            }
        };
        MobileCRM.Bridge.prototype.closeForm = function () {
            /// <summary>Closes a form containing this HTML document.</summary>
            MobileCRM.bridge.command("closeForm");
        };
        MobileCRM.Bridge.prototype.enableDebug = function (callback, errorCallback, scope) {
            /// <summary>Enables platform-specific features for debugging the web page.</summary>
            /// <param name="callback" type="function(obj)">The callback function that is called asynchronously.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called asynchronously in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            /// <remarks><p>After calling this method, it is possible to attach the Google Chrome debugger into the web page opened in MobileCRM application running on Android (KitKat or newer).</p><p>This method also activates the Javascript warnings in Windows 7 app.</p><p>It has dummy implementation on iOS and Android debug build.</p></remarks>
            MobileCRM.bridge.command("enableDebug", "", callback, errorCallback, scope);
        };
        MobileCRM.Bridge.prototype.enableZoom = function (enable) {
            /// <summary>Enables platform-specific pinch zoom gesture.</summary>
            /// <param name="enable" type="Boolean">Indicates whether to enable or disable zooming support.</param>
            /// <remarks><p>After calling this method, it is possible to use the pinch gesture to control the content zoom. This functionality is implemented only on Android. Other platforms either do not support zoom or it is controlled by the HTML viewport meta tag.</p></remarks>
            MobileCRM.bridge.command("enableZoom", enable);
        };
        MobileCRM.Bridge.prototype.getWindowSize = function (callback, errorCallback, scope) {
            /// <summary>[v8.0] Returns the size of the window in logical pixels without any scaling and viewport calculations..</summary>
            /// <param name="callback" type="function(obj)">The callback function that is called asynchronously. Gets an object with the window &quot;width&quot; and &quot;height&quot;.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called asynchronously in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.command("getWindowSize", "", callback, errorCallback, scope);
        };
        MobileCRM.Bridge.prototype.alert = function (text, callback, scope) {
            /// <summary>Shows a message asynchronously and calls the callback after it is closed by user.</summary>
            /// <param name="callback" type="function(obj)">The callback function that is called asynchronously.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            window.setTimeout(function () {
                window.alert(text); // when called directly, alert hangs up on iOS9 (if called from callback invoked from native code)
                if (callback)
                    callback.call(scope);
            });
        };
        MobileCRM.Bridge.prototype.log = function (text) {
            /// <summary>[v8.0] Appends a message into the JSBridge log.</summary>
            /// <param name="text" type="String">A text to be written into the log.</param>
            MobileCRM.bridge.command("log", text);
        };

        // MobileCRM.ExposedObject
        MobileCRM.ExposedObject = function (id) {
            /// <summary>Represents the Javascript placeholder for exposed managed object.</summary>
            /// <param name="id" type="Number">An id of the exposed managed object.</param>
            /// <field name="id" type="Number">An id of the exposed managed object.</field>
            this.id = id;
        };
        MobileCRM.ExposedObject.prototype.asInvokeArgument = function () {
            /// <summary>[v9.1] Returns the exposed object reference which can be used as an argument in invokeMethod functions.</summary>
            return "~ExpObj:#exposedObj#" + this.id;
        };
        MobileCRM.ExposedObject.prototype.invokeMethodAsync = function (method, paramsList, callback, errorCallback, scope) {
            /// <summary>Invokes a method on exposed managed object and returns the result asynchronously via callback.</summary>
            /// <param name="objectName" type="String">The name of exposed managed object as it was registered on C# side (IJavascriptBridge.ExposeObject).</param>
            /// <param name="method" type="String">The name of the method implemented by object class.</param>
            /// <param name="paramsList" type="Array">An array with parameters that should be passed to a method.</param>
            /// <param name="callback" type="function(obj)">The callback function that is called asynchronously with JSON-serialized return value. It is either generic type or <see cref="MobileCRM.ObservableObject">MobileCRM.ObservableObject</see> with JSON-serialized return value.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called asynchronously in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.invokeMethodAsync("#exposedObj#" + this.id, method, paramsList, callback, errorCallback, scope);
        };
        MobileCRM.ExposedObject.prototype.exposeObjectAsync = function (method, paramsList) {
            /// <summary>Exposes the managed object which is the result of the method called on this exposed object.</summary>
            /// <param name="method" type="String">The name of the method implemented by object class.</param>
            /// <param name="paramsList" type="Array">An array with parameters that should be passed to a method.</param>
            /// <returns type="MobileCRM.ExposedObject">The Javascript placeholder object for exposed managed object.</returns>
            return MobileCRM.bridge.exposeObjectAsync("#exposedObj#" + this.id + "." + method, paramsList);
        };
        MobileCRM.ExposedObject.prototype.release = function () {
            /// <summary>Releases the exposed managed object.</summary>
            MobileCRM.bridge.command("releaseExposedObject", this.id);
        };

        // MobileCRM.ObservableObject 
        MobileCRM.ObservableObject = function (props) {
            /// <summary>Represents a generic object which is monitoring the changes of its properties.</summary>
            /// <param name="props" type="Object">Optional list of properties.</param>
            var privChanged = {};
            var typeInfo = {};

            var propertyChanged = new _Event(this);
            propertyChanged.add(function (args) {
                privChanged[args] = true;
            }, this);
            Object.defineProperty(this, "propertyChanged", { value: propertyChanged, enumerable: false });
            Object.defineProperty(this, "_privChanged", { value: privChanged, enumerable: false });
            Object.defineProperty(this, "_typeInfo", { value: typeInfo, enumerable: false });
            if (props) {
                for (var i in props) {
                    this.addProp(i, true, props[i]);
                }
            }
        };
        MobileCRM.ObservableObject.prototype.addProp = function (name, writable, value) {
            /// <summary>Creates a new observable property for this object</summary>
            /// <param name="name" type="String">A name of the new property.</param>
            /// <param name="writable" type="Boolean">Indicates whether the property should have setter.</param>
            /// <param name="value" type="">An initial value.</param>
            _addProperty(this, name, writable, value);
        };
        MobileCRM.ObservableObject.prototype.getChanged = function () {
            /// <summary>Creates a clone of this object containing all properties that were changed since object construction.</summary>
            /// <remarks>This method enumerates object recursively and creates the object clone containing only the changed properties.</remarks>
            /// <returns type="Object">An object clone containing all changed properties.</returns>
            var parse = function (obj, changedProps) {
                var result = undefined;
                for (var i in obj) {
                    var val = obj[i];
                    var changedVal = undefined;
                    if (val instanceof MobileCRM.ObservableObject)
                        changedVal = val.getChanged();
                    else if (changedProps[i] == true)
                        changedVal = val;
                    else if (val && typeof val == "object" && !(val instanceof Date) && i[0] != '_')
                        changedVal = parse(val, {});
                    if (changedVal !== undefined) {
                        if (result == null) {
                            if (obj.constructor == Array) {
                                result = [];
                                for (var j = 0; j < obj.length; j++)
                                    result[j] = null;
                            }
                            else
                                result = {};
                        }
                        var propName = i;
                        if (obj._typeInfo) {
                            var typeInfo = obj._typeInfo[i];
                            if (typeInfo)
                                propName += "-" + typeInfo;
                        }
                        result[propName] = changedVal;
                    }
                }
                return result;
            };
            return parse(this, this._privChanged);
        }
        MobileCRM.ObservableObject.prototype.setTypedValue = function (propName, type, value) {
            /// <summary>[v8.0] Sets the explicitly typed value for specified property.</summary>
            /// <param name="propName" type="String">The name of the property which is being set.</param>
            /// <param name="type" type="String">The fully qualified .Net type (e.g. &quot;System.String&quot; or &quot;MobileCrm.Data.IReference,MobileCrm.Data&quot;).</param>
            /// <param name="value" type="">The value which has to be set.</param>
            this[propName] = value;
            this._typeInfo[propName] = type.replace(',', '-'); // Comma is not allowed by JsonReader, replace to '-'
        };

        //MobileCRM.Configuration
        MobileCRM.Configuration.requestObject = function (callback, errorCallback, scope) {
            /// <summary>Requests the managed Configuration object.</summary>
            /// <remarks>Method initiates an asynchronous request which either ends with calling the <b>errorCallback</b> or with calling the <b>callback</b> with Javascript version of Configuration object. See <see cref="MobileCRM.Bridge.requestObject">MobileCRM.Bridge.requestObject</see> for further details.</remarks>
            /// <param name="callback" type="function(config)">The callback function that is called asynchronously with <see cref="MobileCRM.Configuration">MobileCRM.Configuration</see> object instance as argument. Callback should return true to apply changed properties.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.requestObject("Configuration", function (obj) {
                if (callback.call(scope, obj) != false) {
                    var changed = obj.getChanged();
                    return changed;
                }
                return '';
            }, errorCallback, scope);
        };
        // MobileCRM._Settings
        MobileCRM._Settings = {
            /// <summary>MobileCRM configuration settings class.</summary>
            /// <field name="afterSaveReload" type="Number">Gets options for default after save behavior &quot;None = 0, New = 1,Always = 2&quot;</field>
            /// <field name="authenticationType" type="Number">Gets possible CRM server authentication methods. &quot;AD = 0, PassPort = 1,SPLA = 2,PassportEMEA = 3,PassportAPAC = 4 &quot;</field>
            /// <field name="businessUnitId" type="String">Gets or sets the current user's business unit id.</field>
            /// <field name="canUsePassword" type="Boolean">Gets whether there is a valid password and whether it can be used.</field>
            /// <field name="crm2011AuthId" type="String">Gets or sets the discovered CRM service authentication server identifier.</field>
            /// <field name="crm2011AuthType" type="String">Gets or sets the discovered CRM service authentication server type.</field>
            /// <field name="crm2011AuthUrl" type="String">Gets or sets the discovered CRM service authentication server url.</field>
            /// <field name="crmOnlineDeviceToken" type="String">Gets or sets the token (cookie) issued by LiveId services identifying this device.</field>
            /// <field name="crmOnlineDeviceTokenExpires" type="Date">Gets when CrmOnlineDeviceToken expires (UTC).</field>
            /// <field name="crmWebServiceMinorVersion" type="Number">Gets or sets the discovered CRM service minor version (13 - for CRM 2011 Rollup 13 and up).</field>
            /// <field name="crmWebServiceVersion" type="Number">Gets or sets the discovered CRM service version (4,5).</field>
            /// <field name="currencyDecimalPrecision" type="Number">Gets or sets the organization Pricing Decimal Precision configuration option (0..4).</field>
            /// <field name="currencyDisplayOption" type="Number">Gets or sets the currency field display option 0- Symbol ($), 1 - Code (USD).</field>
            /// <field name="currencyFormatCode" type="Number">Gets or sets the currency field display option 0- $123, 1-123$, 2-$ 123, 3-123 $.</field>
            /// <field name="customerId" type="MobileCRM.Reference">Gets or sets the customer when application is running in customer mode. <see cref="MobileCRM.Reference">MobileCRM.Reference</see> object instance as argument</field>
            /// <field name="customerUserId" type="MobileCRM.Reference">Gets or sets the CustomerUserId when application is running in customer mode. <see cref="MobileCRM.Reference">MobileCRM.Reference</see> object instance as argument</field>
            /// <field name="deviceFriendlyName" type="String">Gets or sets the device friendly name e.g. &quot;Steve's iPhone&quot;.</field>
            /// <field name="deviceIdentifier" type="String">Gets or sets the hardware unique id.</field>
            /// <field name="deviceInfo" type="String">Gets or sets the device system an hardware information e.g. &quot;Hewlett-Packard HP ProBook 6450b\tMicrosoft Windows NT 6.1.7600.0&quot;</field>
            /// <field name="internalDeviceId" type="String">Gets the device id.</field>
            /// <field name="disableSyncAnalyzer" type="Boolean">Gets or sets whether the synchronization should use the SyncAnalyzer step.</field>
            /// <field name="discountCalculationMethod" type="Number">Gets or sets the option for calculating the discount 0 - apply after (Price*Quantity)-Discount , 1- apply before (Price-Discount)*Quantity.</field>
            /// <field name="duplicateDetection" type="Number">Gets whether duplicate detection is enabled and whether to detect against the local database, online, or always online. &quot;Disabled = 0, Enabled = 1,AlwaysOnline = 2&quot;</field>
            /// <field name="enableAdvancedFind" type="Boolean">Gets or sets whether to enabled advanced find functionality. Default true.</field>
            /// <field name="enableListButtons" type="Boolean">Enables list buttons. Default is true.</field>
            /// <field name="enableListSearchButtons" type="Boolean">Gets or sets whether to allow list search buttons.</field>
            /// <field name="forceCustomizationDownload" type="Boolean">Gets or sets a value indicating whether the customization download is forced.</field>
            /// <field name="forcedFullSyncDate" type="Date">Gets or sets the date when the device must be full synced. If the last sync was before this date, the next sync must be full.</field>
            /// <field name="forgetPassword" type="Boolean">Gets or sets whether password can be used for next login.</field>
            /// <field name="fullScreenForms" type="Boolean">Gets or sets whether to show forms maximized by default. Can be overridden per form in Woodford.</field>
            /// <field name="googleEmail" type="String">Gets or sets the Google account email.</field>
            /// <field name="gPSAccuracy" type="Number">Gets or sets the default accuracy (in meters) when resolving the current position.</field>
            /// <field name="gPSMaxAge" type="Number">Gets or sets the default maximum age (in seconds) of the last result when resolving the current position.</field>
            /// <field name="isOnlineCrm" type="Boolean">Gets whether the last login was for a CRM Online instance.</field>
            /// <field name="maxAttachmentSize" type="Number">Gets or sets the maximum attachment size to sync (in bytes).</field>
            /// <field name="onlineNoLock" type="Boolean">Gets or sets whether to use "no-lock" in fetchXml during online mode.</field>
            /// <field name="organizationId" type="String">Gets or sets the current user's organization id (given by the server).</field>
            /// <field name="saveBehavior" type="Number">Gets options for default after save behavior &quot;Default = 0, SaveOnly = 1,SaveAndClose = 2&quot;</field>
            /// <field name="saveSignatureAsImage" type="Boolean">Gets or sets whether to store signature attachments as SVG (vector) or PNG (image).</field>
            /// <field name="serverHostName" type="String">Gets the server host name.</field>
            /// <field name="serverSettingsVersion" type="String">Gets the version of the settings file as send with the customization.</field>
            /// <field name="serverVersion" type="Number">Gets or sets the server version, either 4 for CRM 4.0 or 5 for CRM 2011.</field>
            /// <field name="showPersonalContacts" type="Boolean">Gets or sets whether to show contacts from the user's personal address book.</field>
            /// <field name="showSystemCalendars" type="Boolean">Gets or sets whether to show private calendars in calendars.</field>
            /// <field name="systemUserId" type="String">Gets or sets the current user id (given by the server).</field>
            /// <field name="teams" type="Array<String>">Gets the array of ids of teams the current user is member of.</field>
            /// <field name="useCrmEmail" type="Boolean">Gets or sets whether to create a CRM email entity or use the platform email service.</field>
            /// <field name="useDatabaseBlobStore" type="Boolean">Gets or sets whether to store attachment blobs in database or in files. If you change this setting you must perform a full sync!</field>
            /// <field name="useFlexiForms" type="Boolean">Gets or sets whether flexi forms (New UI).</field>
            /// <field name="googleApiKey" type="String">Gets or sets the google API key.</field>
        }

        MobileCRM.CultureInfo.currentCulture = null;
        MobileCRM.CultureInfo.initialize = function (callback, errorCallback, scope) {
            /// <summary>[v10.2] Initializes the CultureInfo object.</summary>
            /// <remarks><p>Method loads the current culture information asynchronously and calls either the <b>errorCallback</b> with error message or the <b>callback</b> with initialized CultureInfo object.</p><p>All other functions will return the default or empty string before the initialization finishes.</p></remarks>
            /// <param name="callback" type="function(currentCulture)">The callback function that is called asynchronously with initialized CultureInfo object as argument.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is to be called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.command("getCultureInfo", '', function (res) {
                MobileCRM.CultureInfo.currentCulture = res;
                if (callback)
                    callback.call(scope, res);
            }, errorCallback, scope);
        }

        MobileCRM.CultureInfo.load = function (culture, callback, errorCallback, scope) {
            /// <summary>[v10.2] Asynchronously gets the CultureInfo object for specified language/country.</summary>
            /// <remarks><p>Method loads specified culture information asynchronously and calls either the <b>errorCallback</b> with error message or the <b>callback</b> with initialized CultureInfo object.</p><p>All other functions will return the default or empty string before the initialization finishes.</p></remarks>
            /// <param name="culture" type="String">The name of culture that has to be loaded. The culture name is in the format language code-country where language code is a lowercase two-letter code derived from ISO 639-1. country is derived from ISO 3166 and usually consists of two uppercase letters</param>
            /// <param name="callback" type="function(cultureInfo)">The callback function that is called asynchronously with initialized CultureInfo object as argument.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is to be called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.command("getCultureInfo", culture || '', function (res) {
                if (callback)
                    callback.call(scope, res);
            }, errorCallback, scope);
        };

        MobileCRM.CultureInfo.shortDateString = function (date) {
            /// <summary>[v10.2] Returns the short date string that matches current device culture.</summary>
            /// <remarks>This method fails if <see cref="MobileCRM.CultureInfo.initialize">CultureInfo.initialize</see> method hasn't completed yet.</remarks>
            /// <param name="date" type="Date">A date being formatted.</param>
            return MobileCRM.CultureInfo.formatDate(date, MobileCRM.CultureInfo.currentCulture.dateTimeFormat.shortDatePattern)
        };

        MobileCRM.CultureInfo.longDateString = function (date) {
            /// <summary>[v10.2] Returns the long date string that matches current device culture.</summary>
            /// <remarks>This method fails if <see cref="MobileCRM.CultureInfo.initialize">CultureInfo.initialize</see> method hasn't completed yet.</remarks>
            /// <param name="date" type="Date">A date being formatted.</param>
            return MobileCRM.CultureInfo.formatDate(date, MobileCRM.CultureInfo.currentCulture.dateTimeFormat.longDatePattern)
        };

        MobileCRM.CultureInfo.shortTimeString = function (date) {
            /// <summary>[v10.2] Returns the short time string that matches current device culture.</summary>
            /// <remarks>This method fails if <see cref="MobileCRM.CultureInfo.initialize">CultureInfo.initialize</see> method hasn't completed yet.</remarks>
            /// <param name="date" type="Date">A date being formatted.</param>
            return MobileCRM.CultureInfo.formatDate(date, MobileCRM.CultureInfo.currentCulture.dateTimeFormat.shortTimePattern)
        };

        MobileCRM.CultureInfo.longTimeString = function (date) {
            /// <summary>[v10.2] Returns the long time string that matches current device culture.</summary>
            /// <remarks>This method fails if <see cref="MobileCRM.CultureInfo.initialize">CultureInfo.initialize</see> method hasn't completed yet.</remarks>
            /// <param name="date" type="Date">A date being formatted.</param>
            return MobileCRM.CultureInfo.formatDate(date, MobileCRM.CultureInfo.currentCulture.dateTimeFormat.longTimePattern)
        };

        MobileCRM.CultureInfo.fullDateTimeString = function (date) {
            /// <summary>[v10.2] Returns the date and time string that matches current device culture.</summary>
            /// <remarks>This method fails if <see cref="MobileCRM.CultureInfo.initialize">CultureInfo.initialize</see> method hasn't completed yet.</remarks>
            /// <param name="date" type="Date">A date being formatted.</param>
            return MobileCRM.CultureInfo.formatDate(date, MobileCRM.CultureInfo.currentCulture.dateTimeFormat.fullDateTimePattern)
        };

        MobileCRM.CultureInfo.monthDayString = function (date) {
            /// <summary>[v10.2] Returns the month and day string that matches current device culture.</summary>
            /// <remarks>This method fails if <see cref="MobileCRM.CultureInfo.initialize">CultureInfo.initialize</see> method hasn't completed yet.</remarks>
            /// <param name="date" type="Date">A date being formatted.</param>
            return MobileCRM.CultureInfo.formatDate(date, MobileCRM.CultureInfo.currentCulture.dateTimeFormat.monthDayPattern)
        };

        MobileCRM.CultureInfo.yearMonthString = function (date) {
            /// <summary>[v10.2] Returns the year and month string that matches current device culture.</summary>
            /// <remarks>This method fails if <see cref="MobileCRM.CultureInfo.initialize">CultureInfo.initialize</see> method hasn't completed yet.</remarks>
            /// <param name="date" type="Date">A date being formatted.</param>
            return MobileCRM.CultureInfo.formatDate(date, MobileCRM.CultureInfo.currentCulture.dateTimeFormat.yearMonthPattern)
        };

        MobileCRM.CultureInfo.formatDate = function (date, format) {
            /// <summary>[v10.2] Returns the formatted date/time string that matches current device culture.</summary>
            /// <remarks>This method fails if <see cref="MobileCRM.CultureInfo.initialize">CultureInfo.initialize</see> method hasn't completed yet.</remarks>
            /// <param name="date" type="Date">A date being formatted.</param>
            /// <param name="format" type="String">Custom format string that meets the <see cref="https://docs.microsoft.com/en-us/dotnet/standard/base-types/custom-date-and-time-format-strings">MSDN Sepcification</see>.</param>
            var df = MobileCRM.CultureInfo.currentCulture.dateTimeFormat;
            var zeroPad = function (num, length, dontCut) {
                var st = "" + num;
                if (st.length > length)
                    return dontCut ? st : st.substr(0, length);
                while (st.length < length)
                    st = "0" + st;
                return st;
            };
            var trimDigits = function (num, length) {
                var st = "" + num;
                if (st.length > length)
                    return st.substr(0, length);
                return st;
            };
            var hoursTo12h = function (h) {
                return h <= 12 ? h : (h % 12);
            };
            var i = 0;
            var fLen = format.length;
            var res = "";
            while (i < fLen) {
                var c = format.charAt(i);
                switch (c) {
                    case 'd': // Day
                        if (format.charAt(++i) === 'd') {
                            if (format.charAt(++i) === 'd') {
                                if (format.charAt(++i) === 'd') {
                                    res += df.dayNames[date.getDay()];
                                    i++;
                                }
                                else
                                    res += df.abbreviatedDayNames[date.getDay()];
                            }
                            else
                                res += zeroPad(date.getDate(), 2, false);
                        } else
                            res += date.getDate();
                        break;
                    case 'f':
                        if (format.charAt(++i) === 'f') {
                            if (format.charAt(++i) === 'f') {
                                if (format.charAt(++i) === 'f') {
                                    if (format.charAt(++i) === 'f') {
                                        if (format.charAt(++i) === 'f') {
                                            if (format.charAt(++i) === 'f') {
                                                res += date.getMilliseconds();
                                                i++;
                                            }
                                            else
                                                res += date.getMilliseconds();
                                        }
                                        else
                                            res += date.getMilliseconds();
                                    }
                                    else
                                        res += date.getMilliseconds();
                                }
                                else
                                    res += date.getMilliseconds();
                            }
                            else
                                res += trimDigits(date.getMilliseconds(), 2);
                        }
                        else
                            res += trimDigits(date.getMilliseconds(), 1);
                        break;
                    case 'F':
                        if (format.charAt(++i) === 'F') {
                            if (format.charAt(++i) === 'F') {
                                if (format.charAt(++i) === 'F') {
                                    if (format.charAt(++i) === 'F') {
                                        if (format.charAt(++i) === 'F') {
                                            if (format.charAt(++i) === 'F') {
                                                res += zeroPad(date.getMilliseconds(), 7, false);
                                                i++;
                                            }
                                            else
                                                res += zeroPad(date.getMilliseconds(), 6, false);
                                        }
                                        else
                                            res += zeroPad(date.getMilliseconds(), 5, false);
                                    }
                                    else
                                        res += zeroPad(date.getMilliseconds(), 4, false);
                                }
                                else
                                    res += zeroPad(date.getMilliseconds(), 3, false);
                            }
                            else
                                res += zeroPad(date.getMilliseconds(), 2, false);
                        }
                        else
                            res += zeroPad(date.getMilliseconds(), 1, false);
                        break;
                    case 'g':
                        if (format.charAt(++i) === 'g') {
                            res += "A.D.";
                            i++;
                        }
                        else
                            res += "AD";
                        break;
                    case 'h':
                        if (format.charAt(++i) === 'h') {
                            res += zeroPad(hoursTo12h(date.getHours()), 2, false);
                            i++;
                        }
                        else
                            res += hoursTo12h(date.getHours());
                        break;
                    case 'H':
                        if (format.charAt(++i) === 'H') {
                            res += zeroPad(date.getHours(), 2, false);
                            i++;
                        }
                        else
                            res += date.getHours();
                        break;
                    case 'K':
                        var o = -date.getTimezoneOffset();
                        res += (o < 0 ? "-" : "") + zeroPad(Math.abs(o / 60), 2, false) + ":" + zeroPad(o % 60, 2, false);
                        i++;
                        break;
                    case 'm':
                        if (format.charAt(++i) === 'm') {
                            res += zeroPad(date.getMinutes(), 2, false);
                            i++;
                        }
                        else
                            res += date.getMinutes();
                        break;
                    case 's':
                        if (format.charAt(++i) === 's') {
                            res += zeroPad(date.getSeconds(), 2, false);
                            i++;
                        }
                        else
                            res += date.getSeconds();
                        break;
                    case 'M':
                        if (format.charAt(++i) === 'M') {
                            if (format.charAt(++i) === 'M') {
                                if (format.charAt(++i) === 'M') {
                                    res += df.monthGenitiveNames[date.getMonth()];
                                    i++;
                                }
                                else
                                    res += df.abbreviatedMonthGenitiveNames[date.getMonth()];
                            }
                            else
                                res += zeroPad(date.getMonth() + 1, 2, false);
                        } else
                            res += date.getMonth() + 1;
                        break;
                    case 't':
                        if (format.charAt(++i) === 't')
                            i++;

                        res += date.getHours() < 12 ? df.aMDesignator : df.pMDesignator;
                        break;
                    case 'y':
                        if (format.charAt(++i) === 'y') {
                            if (format.charAt(++i) === 'y') {
                                if (format.charAt(++i) === 'y') {
                                    if (format.charAt(++i) === 'y') {
                                        res += zeroPad(date.getFullYear(), 5, true);
                                        i++;
                                    }
                                    else
                                        res += zeroPad(date.getFullYear(), 4, true);
                                }
                                else
                                    res += zeroPad(date.getFullYear(), 3, true);
                            } else
                                res += zeroPad(date.getFullYear() % 100, 2, false);
                        }
                        else
                            res += date.getFullYear() % 100;
                        break;
                    case 'z':
                        if (format.charAt(++i) === 'z') {
                            var o = -date.getTimezoneOffset();
                            if (format.charAt(++i) === 'z') {
                                res += (o < 0 ? "-" : "") + zeroPad(Math.abs(o / 60), 2, false) + ":" + zeroPad(o % 60, 2, false);
                                i++;
                            }
                            else
                                res += (o < 0 ? "-" : "") + zeroPad(Math.abs(o / 60), 2, false);
                        }
                        else
                            res += -date.getTimezoneOffset() / 60;
                    case '/':
                        res += (typeof (df.dateSeparator) == "string") ? df.dateSeparator : '/';
                        i++;
                        break;
                    case ':':
                        res += (typeof (df.timeSeparator) == "string") ? df.timeSeparator : ':';
                        i++;
                        break;
                    default:
                        res += c;
                        i++;
                        break;
                }
            }
            return res;
        };

        //MobileCRM.Localization
        MobileCRM.Localization.initialize = function (callback, errorCallback, scope) {
            /// <summary>Initializes the Localization object.</summary>
            /// <remarks><p>Method loads the string table asynchronously and calls either the <b>errorCallback</b> with error message or the <b>callback</b> with initialized Localization object.</p><p>All other functions will return the default or empty string before the initialization finishes.</p></remarks>
            /// <param name="callback" type="function(config)">The callback function that is called asynchronously with initialized Localization object as argument.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is to be called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.Localization.initializeEx(null, callback, errorCallback, scope);
        };
        MobileCRM.Localization.initializeEx = function (regularExpression, callback, errorCallback, scope) {
            /// <summary>[v10.0] Initializes the Localization object.</summary>
            /// <remarks><p>Method loads the string table asynchronously and calls either the <b>errorCallback</b> with error message or the <b>callback</b> with initialized Localization object.</p><p>All other functions will return the default or empty string before the initialization finishes.</p></remarks>
            /// <param name="regularExpression" type="string">The regular expression defining a subset of localization keys. Refer to <see cref="https://msdn.microsoft.com/en-us/library/az24scfc(v=vs.110).aspx">Regular Expression Language - Quick Reference</see>. Set to null to obtain whole localization.</param>
            /// <param name="callback" type="function(config)">The callback function that is called asynchronously with initialized Localization object as argument.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is to be called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.command("localizationInit", regularExpression || '', function (res) {
                MobileCRM.Localization.stringTable = res;
                MobileCRM.Localization.initialized = true;
                if (callback)
                    callback.call(scope, MobileCRM.Localization);
            }, errorCallback, scope);
        };
        MobileCRM.Localization.getLoadedLangId = function (callback, errorCallback, scope) {
            /// <summary>Asynchronously gets currently loaded localization language.</summary>
            /// <remarks>The default language is &quot;en-US&quot;.</remarks>
            /// <param name="callback" type="function(langId)">The callback function that is called asynchronously with currently loaded localization language as argument.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is to be called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.invokeStaticMethodAsync("MobileCrm.Data", "MobileCrm.Localization", "get_LoadedLangId", [], callback, errorCallback, scope);
        };
        MobileCRM.Localization.getTextOrDefault = function (id, defaultString) {
            /// <summary>Gets the display string for the passed id, or the passed default string if a string with the passed id doesn't exists.</summary>
            /// <param name="id" type="String">Display string id.</param>
            /// <param name="defaultString" type="String">Default display string.</param>
            /// <returns type="String">Human readable string label.</returns>
            return MobileCRM.Localization.stringTable[id] || defaultString;
        };
        MobileCRM.Localization.getComponentLabel = function (entityName, componentType, viewName) {
            /// <summary>Gets the display string for the passed entity and component (view, form) id.</summary>
            /// <param name="entityName" type="String">The entity logical name.</param>
            /// <param name="componentType" type="String">The component type. (View, DetailView).</param>
            /// <param name="viewName" type="String">The component id</param>
            /// <returns type="String">The component label.</returns>
            return MobileCRM.Localization.stringTable[entityName + "." + componentType + "." + viewName] || MobileCRM.Localization.stringTable[componentType + "." + viewName] || viewName;
        }
        MobileCRM.Localization.get = function (id) {
            /// <summary>Gets the display string for the passed id.</summary>
            /// <param name="id" type="String">Display string id.</param>
            /// <returns type="String">Human readable string label.</returns>
            return MobileCRM.Localization.getTextOrDefault(id, id);
        }
        MobileCRM.Localization.getPlural = function (id) {
            /// <summary>Gets the plural version of the display string for the passed id.</summary>
            /// <param name="id" type="String">Display string id.</param>
            /// <returns type="String">Human readable plural string label.</returns>
            return MobileCRM.Localization.get(id + "+s");
        }
        MobileCRM.Localization.makeId = function (section, id) {
            /// <summary>Creates an absolute id from section and id.</summary>
            /// <param name="section" type="String">The section id.</param>
            /// <param name="id" type="String">Display string id.</param>
            /// <returns type="String">Absolute id.</returns>
            return section + "." + id;
        }

        //MobileCRM.Reference
        MobileCRM.Reference.prototype.toString = function () {
            /// <summary>Prints the reference primary name into string.</summary>
            /// <returns type="String">A string with primary name of this entity reference.</returns>
            return this.primaryName;
        }
        MobileCRM.Reference.loadById = function (entityName, id, success, failed, scope) {
            /// <summary>Asynchronously loads the CRM reference.</summary>
            /// <param name="entityName" type="String">An entity name</param>
            /// <param name="id" type="String">The reference ID.</param>
            /// <param name="success" type="function(result)">A callback function for successful asynchronous result. The <b>result</b> will carry an instance of <see cref="MobileCRM.Reference">MobileCRM.Reference</see> object.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>
            window.MobileCRM.bridge.command('referenceload', JSON.stringify({ entity: entityName, id: id }), success, failed, scope);
        };

        // MobileCRM.ManyToManyReference
        MobileCRM.ManyToManyReference.addRecord = function (entityName, ref1, ref2, create, success, failed, scope) {
            /// <summary>Adds or removes an N-N relationship record between the two passed entities.</summary>
            /// <param name="entityName" type="String">The relationship entity name.</param>
            /// <param name="ref1" type="MobileCRM.Reference">First entity instance.</param>
            /// <param name="ref2" type="MobileCRM.Reference">Second entity instance.</param>
            /// <param name="create" type="Boolean">Whether to create or delete the relationship record.</param>
            /// <param name="success" type="function(result)">A callback function for successful asynchronous result.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>
            MobileCRM.bridge.command('addManyToManyReference', JSON.stringify({ entityName: entityName, ref1: ref1, ref2: ref2, create: create }), success, failed, scope);
        };
        MobileCRM.ManyToManyReference.create = function (entityName, ref1, ref2, success, failed, scope) {
            /// <summary>Creates a new N-N relationship between the two passed entities.</summary>
            /// <remarks>New relationship is created either in local database or using the online request. It depends on current application mode.</remarks>
            /// <param name="entityName" type="String">The relationship entity name.</param>
            /// <param name="ref1" type="MobileCRM.Reference">First entity instance.</param>
            /// <param name="ref2" type="MobileCRM.Reference">Second entity instance.</param>
            /// <param name="success" type="function(result)">A callback function for successful asynchronous result.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>
            MobileCRM.ManyToManyReference.addRecord(entityName, ref1, ref2, true, success, failed, scope);
        };
        MobileCRM.ManyToManyReference.remove = function (entityName, ref1, ref2, success, failed, scope) {
            /// <summary>Removes an existing N-N relationship between the two passed entities.</summary>
            /// <remarks>Relationship is removed either from local database or using the online request. It depends on current application mode.</remarks>
            /// <param name="entityName" type="String">The relationship entity name.</param>
            /// <param name="ref1" type="MobileCRM.Reference">First entity instance.</param>
            /// <param name="ref2" type="MobileCRM.Reference">Second entity instance.</param>
            /// <param name="success" type="function(result)">A callback function for successful asynchronous result.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>
            MobileCRM.ManyToManyReference.addRecord(entityName, ref1, ref2, false, success, failed, scope);
        };

        // MobileCRM.DynamicEntity
        _inherit(MobileCRM.DynamicEntity, MobileCRM.Reference);

        MobileCRM.DynamicEntity.legacyPropsSerialization = false; // serves to disable the legacy fields serialization (bool/string issue) 

        MobileCRM.DynamicEntity.createNew = function (entityName, id, primaryName, properties) {
            /// <summary>Creates the MobileCRM.DynamicEntity object representing new entity.</summary>
            /// <param name="entityName" type="String">The logical name of the entity, e.g. "account".</param>
            /// <param name="id" type="String">GUID of the existing entity or null for new one.</param>
            /// <param name="primaryName" type="String">The human readable name of the entity, e.g "Alexandro".</param>
            /// <param name="properties" type="Object">An object with entity properties, e.g. {firstname:"Alexandro", lastname:"Puccini"}.</param>
            var entity = new MobileCRM.DynamicEntity(entityName, id, primaryName, properties);
            entity.isNew = true;
            return entity;
        }
        MobileCRM.DynamicEntity.deleteById = function (entityName, id, success, failed, scope) {
            /// <summary>Asynchronously deletes the CRM entity.</summary>
            /// <param name="entityName" type="String">The logical name of the entity, e.g. "account".</param>
            /// <param name="id" type="String">GUID of the existing entity or null for new one.</param>
            /// <param name="success" type="function()">A callback function for successful asynchronous result.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>
            var request = { entity: entityName, id: id };
            var cmdParams = JSON.stringify(request);
            window.MobileCRM.bridge.command('entitydelete', cmdParams, success, failed, scope);
        };
        MobileCRM.DynamicEntity.loadById = function (entityName, id, success, failed, scope) {
            /// <summary>Asynchronously loads the CRM entity properties.</summary>
            /// <param name="entityName" type="String">The logical name of the entity, e.g. "account".</param>
            /// <param name="id" type="String">GUID of the existing entity or null for new one.</param>
            /// <param name="success" type="function(result)">A callback function for successful asynchronous result. The <b>result</b> argument will carry the MobileCRM.DynamicEntity object.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>
            window.MobileCRM.bridge.command('entityload', JSON.stringify({ entity: entityName, id: id }), success, failed, scope);
        };
        MobileCRM.DynamicEntity.saveDocumentBody = function (entityId, entityName, relationship, filePath, mimeType, success, failed, scope) {
            /// <summary>[v10.0]Asynchronously saves the document body for specified entity.</summary>
            /// <remarks>Function sends an asynchronous request to application, where the locally stored document body (e.g. the annotation.documentbody) is saved.</remarks>
            /// <param name="entityId" type="String">GUID of the existing entity or &quot;null&quot; for new one.</param>
            /// <param name="entityName" type="String">The logical name of the entity; optional, default is &quot;annotation&quot;.</param>
            /// <param name="relationship" type="MobileCRM.Relationship">The relationship with parent object.</param>
            /// <param name="filePath" type="String">Absolute or app data-relative path to the file holding the body.</param>
            /// <param name="mimeType" type="String">MimeType of the content, optional.</param>
            /// <param name="success" type="function(MobileCRM.Reference)">A callback function for successful asynchronous result. The <b>result</b> argument will carry the <see cref="MobileCRM.Reference">Reference</see> to updated/created entity.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>
            window.MobileCRM.bridge.command('documentBodysave', JSON.stringify({ entity: entityName, id: entityId, relationship: relationship, filePath: filePath, mimeType: mimeType }), success, failed, scope);
        };
        MobileCRM.DynamicEntity.loadDocumentBody = function (entityName, id, success, failed, scope) {
            /// <summary>Asynchronously loads the document body for specified entity.</summary>
            /// <remarks>Function sends an asynchronous request to application, where the locally stored document body (e.g. the annotation.documentbody) is encoded to base64 and sent back to the Javascript callback. This function supports both online data and the data stored in local database/BLOB store.</remarks>
            /// <param name="entityName" type="String">The logical name of the entity, in most cases "annotation".</param>
            /// <param name="id" type="String">GUID of the existing entity or null for new one.</param>
            /// <param name="success" type="function(result)">A callback function for successful asynchronous result. The <b>result</b> argument will carry the string with base64-encoded data.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>
            window.MobileCRM.bridge.command('documentBodyload', JSON.stringify({ entity: entityName, id: id }), success, failed, scope);
        };
        MobileCRM.DynamicEntity.unzipDocumentBody = function (entityName, id, targetDir, success, failed, scope) {
            /// <summary>[v9.1] Asynchronously unpacks the document body (assumes it's a zip file) for specified entity.</summary>
            /// <param name="entityName" type="String">The logical name of the entity, in most cases the "annotation".</param>
            /// <param name="id" type="String">GUID of the existing entity or null for new one.</param>
            /// <param name="targetDir" type="String">The relative path of the target directory within the application storage.</param>
            /// <param name="success" type="function(result)">A callback function for successful asynchronous result. The <b>result</b> argument will carry the string with base64-encoded data.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>
            window.MobileCRM.bridge.command('documentBodyUnzip', targetDir + ';' + JSON.stringify({ entity: entityName, id: id }), success, failed, scope);
        };
        MobileCRM.DynamicEntity.downloadAttachment = function (entityName, id, success, failed, scope) {
            /// <summary>[v9.1] Initiates the attachment download for specified entity.</summary>
            /// <remarks>Function sends an asynchronous request to application, which downloads the document body (e.g. the annotation) from server and sends it back to the Javascript callback.</remarks>
            /// <param name="entityName" type="String">The logical name of the entity, in most cases "annotation".</param>
            /// <param name="id" type="String">GUID of the existing entity or null for new one.</param>
            /// <param name="success" type="function(result)">A callback function for successful asynchronous result. The <b>result</b> argument will carry the string with base64-encoded data.</param>
            /// <param name="failed" type="function(error)">A callback function for command failure. The <b>error</b> argument will carry the error message.</param>
            /// <param name="scope" type="">A scope for calling the callbacks; set &quot;null&quot; to call the callbacks in global scope.</param>

            window.MobileCRM.bridge.command("downloadAttachment", JSON.stringify({ entity: entityName, id: id }), success, failed, scope);
        }
        MobileCRM.DynamicEntity.prototype.save = function (callback, forceMode) {
            /// <summary>Performs the asynchronous CRM create/modify entity command.</summary>
            /// <param name="callback" type="function(err)">A callback function for asynchronous result. The <b>err</b> argument will carry the error message or null in case of success. The callback is called in scope of DynamicEntity object which is being saved.</param>
            /// <param name="forceMode" type="Boolean">[v10.0.2] Optional parameter which forces online/offline mode for saving. Set &quot;true&quot; to save entity online; &quot;false&quot; to save it offline. Any other value (including &quot;undefined&quot;) causes entity tobe saved in currently selected application offline/online mode.</param>
            var props = this.properties;
            if (props._privVals)
                props = props._privVals;
            var request = { entity: this.entityName, id: this.id, properties: props, isNew: this.isNew, isOnline: this.isOnline };
            if (forceMode === true || forceMode === false)
                request.isOnlineForce = forceMode;
            if (this.forceDirty)
                request.forceDirty = this.forceDirty;
            var cmdParams = JSON.stringify(request);
            var self = this;
            window.MobileCRM.bridge.command('entitysave', cmdParams,
                function (res) {
                    self.id = res.id;
                    self.isNew = false;
                    self.isOnline = res.isOnline;
                    self.primaryName = res.primaryName;
                    self.properties = res.properties;
                    callback.call(self, null);
                },
                function (err) {
                    callback.call(self, err);
                }, null);
            return this;
        };

        MobileCRM.DynamicEntity.prototype.saveAsync = function (forceMode) {
            /// <summary>Performs the asynchronous CRM create/modify entity command.</summary>
            /// <param name="forceMode" type="Boolean">Optional parameter which forces online/offline mode for saving. Set &quot;true&quot; to save entity online; &quot;false&quot; to save it offline. Any other value (including &quot;undefined&quot;) causes entity to be saved in currently selected application offline/online mode.</param>
            /// <returns type="Promise&lt;DynamicEntity&gt;">A Promise object which will be resolved with saved DynamicEntity object as result.</returns>
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.save(function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this);
                }, forceMode);
            });
        };

        // MobileCRM.Metadata
        MobileCRM.Metadata.requestObject = function (callback, errorCallback, scope) {
            /// <summary>Requests the Metadata object containing the list of MetaEntities which are enabled for current mobile project.</summary>
            /// <remarks>Method initiates an asynchronous request which either ends with calling the <b>errorCallback</b> or with calling the <b>callback</b> with Javascript version of Metadata object. See <see cref="MobileCRM.Bridge.requestObject">MobileCRM.Bridge.requestObject</see> for further details.</remarks>
            /// <param name="callback" type="function(metadata)">The callback function which is called asynchronously with serialized EntityForm object as argument. Callback should return true to apply changed properties.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            MobileCRM.bridge.requestObject("Metadata", function (obj) {
                if (obj) {
                    MobileCRM.Metadata.entities = obj;
                }
                callback.call(scope, MobileCRM.Metadata);
                return '';
            }, errorCallback, scope);
        }

        MobileCRM.Metadata.getEntity = function (name) {
            /// <summary>Gets the MetaEntity object describing the entity attributes.</summary>
            /// <remarks>It&apos;s required to request the Metadata object prior to using this object. See <see cref="MobileCRM.Metadata.requestObject">MobileCRM.Metadata.requestObject</see>.</remarks>
            /// <param name="name" type="String">A name of MetaEntity.</param>
            /// <returns type="MobileCRM.MetaEntity">A <see cref="MobileCRM.MetaEntity">MobileCRM.MetaEntity</see> object or "undefined".</returns>
            return MobileCRM.Metadata.entities[name];
        };

        MobileCRM.Metadata.getActivities = function () {
            /// <summary>Gets the list of activities.</summary>
            /// <remarks>It&amp;s required to request the Metadata object prior to using this object. See <see cref="MobileCRM.Metadata.requestObject">MobileCRM.Metadata.requestObject</see>.</remarks>
            /// <returns type="Array">An array of entity names.</returns>
            var arr = [];
            var metaEntities = MobileCRM.Metadata.entities;
            for (var entity in metaEntities) {
                var meta = metaEntities[entity];
                if (meta && meta.isEnabled && meta.canRead() && (meta.attributes & 0x10) != 0)
                    arr.push(meta.name);
            }
            return arr;
        };

        MobileCRM.Metadata._childParentMap = { invoicedetail: "invoice", quotedetail: "quote", salesorderdetail: "salesorder", opportunityproduct: "opportunity", uom: "uomschedule", productpricelevel: "pricelevel", discount: "discounttype", contractdetail: "contract", salesliteratureitem: "salesliterature", queueitem: "queue", activitymimeattachment: "email" };
        MobileCRM.Metadata.getEntityParent = function (childEntityName) {
            /// <summary>Gets the entity&#39;s parent entity name.</summary>
            /// <param name="childEntityName" type="String">The entity name.</param>
            /// <returns type="String">The parent entity name, or "undefined" if N/A.</returns>
            return MobileCRM.Metadata._childParentMap[childEntityName];
        };

        MobileCRM.Metadata.entityHasChildren = function (entityName) {
            /// <summary>Gets whether the passed entity has child entities.</summary>
            /// <param name="entityName" type="String">The entity name.</param>
            /// <returns type="Boolean">True if the entity is a parent, false otherwise.</returns>
            return "undefined" != typeof MobileCRM.Metadata._childParentMap[entityName];
        };
        MobileCRM.Metadata.getOptionSetValues = function (entityName, optionSetName, callback, errorCallback, scope) {
            /// <summary>Asynchronously gets the list of values for given CRM OptionSet.</summary>
            /// <param name="entityName" type="String">The entity name.</param>
            /// <param name="optionSetName" type="String">The OptionSet name.</param>
            /// <param name="callback" type="function(optionSetValues)">The callback function that is called asynchronously with option set values object as argument.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            var fn = function () {
                var result = {};
                var stringTable = MobileCRM.Localization.stringTable;
                var searchVal = entityName + '.' + optionSetName + '.';
                var searchValLen = searchVal.length;
                for (var i in stringTable) {
                    if (i && i.substr(0, searchValLen) == searchVal) {
                        var val = parseInt(i.substr(searchValLen), 10);
                        if (val > 0) {
                            var st = stringTable[i];
                            result[st] = val;
                        }
                    }
                }
                callback.call(scope, result);
            };
            if (MobileCRM.Localization.initialized)
                fn();
            else
                MobileCRM.Localization.initialize(fn, errorCallback, scope);
        };
        MobileCRM.Metadata.getStringListOptions = function (entityName, propertyName) {
            /// <summary>Gets the list of options for the string list property.</summary>
            /// <param name="entityName" type="String">The entity name.</param>
            /// <param name="propertyName" type="String">The string list property name.</param>
            var options = {};
            var keyPrefix = entityName + "." + propertyName + ".";
            for (var key in MobileCRM.Localization.stringTable) {
                var label = MobileCRM.Localization.stringTable[key];
                if (key.substring(0, keyPrefix.length) === keyPrefix) {
                    options[key] = label;
                }
            }
            return options;
        }

        // MobileCRM.MetaEntity
        _inherit(MobileCRM.MetaEntity, MobileCRM.ObservableObject);

        MobileCRM.MetaEntity.loadByName = function (name, callback, errorCallback, scope) {
            /// <summary>Gets the MetaEntity by its name.</summary>
            /// <remarks>If you only need to know the attributes of a single entity, use this method to prevent requesting all Metadata information.</remarks>
            /// <param name="name" type="String">A logical name of requested entity.</param>
            /// <param name="callback" type="function">The callback function that is called asynchronously with MetaEntity object as argument.</param>
            /// <param name="errorCallback" type="function(errorMsg)">The errorCallback which is called in case of error.</param>
            /// <param name="scope" type="Object">The scope for callbacks.</param>
            var obj = MobileCRM.bridge.exposeObjectAsync("MobileCrm.Data:MobileCrm.Data.Metadata.get_Entities", []);
            obj.invokeMethodAsync("get_Item", [name], function (metaEntity) {
                callback(metaEntity, scope);
                obj.release();
            }, errorCallback, scope);
        }
        MobileCRM.MetaEntity.prototype.getProperty = function (name) {
            /// <summary>Gets the MetaProperty object describing the CRM attribute (field) properties.</summary>
            /// <param name="name" type="String">A logical name of the CRM field.</param>
            /// <returns type="MobileCRM.MetaProperty">An instance of the <see cref="MobileCRM.MetaProperty">MobileCRM.MetaProperty</see> object or "null".</returns>
            return _findInArray(this.properties, "name", name);
        };
        MobileCRM.MetaEntity.prototype.canRead = function () {
            /// <summary>Checks whether the current user has read permission on the entity type.</summary>
            /// <returns type="Boolean">True if the permission is granted, false otherwise.</returns>
            return this.getDepth(0) != 0;
        }
        MobileCRM.MetaEntity.prototype.canWrite = function () {
            /// <summary>Checks whether the current user has write permission on the entity type.</summary>
            /// <returns type="Boolean">True if the permission is granted, false otherwise.</returns>
            return this.getDepth(1) != 0;
        }
        MobileCRM.MetaEntity.prototype.canCreate = function () {
            /// <summary>Checks whether the current user has create permission on the entity type.</summary>
            /// <returns type="Boolean">True if the permission is granted, false otherwise.</returns>
            return this.getDepth(2) != 0;
        }
        MobileCRM.MetaEntity.prototype.canAppendTo = function (child) {
	        /// <summary>Checks whethe
/**
 * The type of cost that a free card must pay
 */
export var CostType;
(function (CostType) {
    CostType[CostType["BanishFromDeck"] = 0] = "BanishFromDeck";
    CostType[CostType["BanishFromHand"] = 1] = "BanishFromHand";
    CostType[CostType["PayLife"] = 2] = "PayLife";
    CostType[CostType["Discard"] = 3] = "Discard";
})(CostType || (CostType = {}));
/**
 * The type of a condition that the free card imposes
 */
export var ConditionType;
(function (ConditionType) {
    ConditionType[ConditionType["Discard"] = 0] = "Discard";
    ConditionType[ConditionType["BanishFromHand"] = 1] = "BanishFromHand";
    ConditionType[ConditionType["BanishFromDeck"] = 2] = "BanishFromDeck";
})(ConditionType || (ConditionType = {}));
/**
 * The type of restriction that the free card imposes
 */
export var RestrictionType;
(function (RestrictionType) {
    RestrictionType[RestrictionType["NoSpecialSummon"] = 0] = "NoSpecialSummon";
    RestrictionType[RestrictionType["NoMoreDraws"] = 1] = "NoMoreDraws";
    RestrictionType[RestrictionType["NoPreviousDraws"] = 2] = "NoPreviousDraws";
})(RestrictionType || (RestrictionType = {}));

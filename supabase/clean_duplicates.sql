-- ==============================================================================
-- AUTO-GENERATED CLEANUP AND MERGE SCRIPT
-- ==============================================================================

DO $$
BEGIN

    -- DB Name: "Shin Yongjae (KOR-1)" -> Merging into: "Shin Yongjae"
    -- Reason: duplicate has extra words/suffix
    RAISE NOTICE 'Merging "%" into "%"', 'Shin Yongjae (KOR-1)', 'Shin Yongjae';
    PERFORM merge_professors('0b8de531-73fd-49f9-8422-3e3b2670d66c', '9e01c55f-c518-42ac-8c65-d493ea6e8160');

    -- DB Name: "Ospanova Zhanna (GER-1)" -> Merging into: "Ospanova Zhanna"
    -- Reason: duplicate has extra words/suffix
    RAISE NOTICE 'Merging "%" into "%"', 'Ospanova Zhanna (GER-1)', 'Ospanova Zhanna';
    PERFORM merge_professors('989801a2-0de4-4e68-b1ce-5dc9193bd297', '2e4fcb61-f82f-4785-89f1-2c2291af2ce8');

    -- DB Name: "Saule Shunkeyeva (GER-8)" -> Merging into: "Saule Shunkeyeva"
    -- Reason: duplicate has extra words/suffix
    RAISE NOTICE 'Merging "%" into "%"', 'Saule Shunkeyeva (GER-8)', 'Saule Shunkeyeva';
    PERFORM merge_professors('35bcf9e8-0c43-4fc7-8813-f598811dce9e', '2b82881d-4fc0-4d44-bc74-018b2d8196f2');

    -- DB Name: "Zhupar Kalekenova (CHIN-8)" -> Merging into: "Zhupar Kalekenova"
    -- Reason: duplicate has extra words/suffix
    RAISE NOTICE 'Merging "%" into "%"', 'Zhupar Kalekenova (CHIN-8)', 'Zhupar Kalekenova';
    PERFORM merge_professors('faccacdb-efff-4707-96e5-25e080d1bff1', '2eb05c86-4102-49a8-9c9a-58e885e5953e');

    -- DB Name: "Shakenova Sagyngul (GER-8)" -> Merging into: "Shakenova Sagyngul"
    -- Reason: duplicate has extra words/suffix
    RAISE NOTICE 'Merging "%" into "%"', 'Shakenova Sagyngul (GER-8)', 'Shakenova Sagyngul';
    PERFORM merge_professors('6c4b84ae-ac02-4832-bf08-7a7f27bc02f1', '93d2b60a-8390-4d8f-b148-1f2b2b41c5a9');

    -- DB Name: "Yessimova Kalamkas (CHIN-1)" -> Merging into: "Yessimova Kalamkas"
    -- Reason: duplicate has extra words/suffix
    RAISE NOTICE 'Merging "%" into "%"', 'Yessimova Kalamkas (CHIN-1)', 'Yessimova Kalamkas';
    PERFORM merge_professors('35296a21-ca03-4351-8705-2b7a34b6fd95', 'ff99338e-cf7b-4000-807a-ed65d9ac6b59');

END $$;

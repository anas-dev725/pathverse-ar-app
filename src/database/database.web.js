// Web mock for SQLite Database. Allows Web Preview in IDE without Native module crashing.
export const initDB = () => {
    console.log("Mock SQLite Init on Web");
};
export const seedDummyData = () => {};

export const getAllNodes = () => {
  return [
    { id: 'loc_1776498824903', name: "Lab 6", x: 0.02, y: 0, z: -0.01, type: 'room' },
    { id: 'loc_1783705338091', name: "2nd floor main gate", x: 0.23, y: 0.08, z: -0.23, type: 'corridor' },
    { id: 'loc_1783705414239', name: "2nd floor", x: 0.04, y: 0.03, z: 0.02, type: 'room' },
    { id: 'loc_1783705445555', name: "3rd floor stairs base", x: -0.68, y: 0.02, z: -4.44, type: 'corridor' },
    { id: 'loc_1783705474966', name: "3rd floor stairs one midway", x: -4.02, y: 1.09, z: -4.57, type: 'stairs' },
    { id: 'loc_1783705505137', name: "3rd floor second midway", x: -3.8, y: 1.97, z: -1.19, type: 'stairs' },
    { id: 'loc_1783705529988', name: "3rd floor stairs landing", x: -0.95, y: 2.98, z: -1.02, type: 'corridor' },
    { id: 'loc_1783705554117', name: "314", x: -0.3, y: 2.98, z: 6.01, type: 'room' },
    { id: 'loc_1783772308590', name: "California basement", x: 0.03, y: 0.01, z: 0, type: 'room' },
    { id: 'loc_1783772346535', name: "Stairs basement", x: 0.27, y: 0.16, z: -9.48, type: 'room' },
    { id: 'loc_1783772367978', name: "Stairs mid", x: -0.32, y: 1.11, z: -12.39, type: 'room' },
    { id: 'loc_1783772390844', name: "California 1st floor", x: 2.93, y: 3.27, z: -15.06, type: 'room' },
    { id: 'loc_1785552490566', name: "Uni main gate", x: 0.03, y: 0.01, z: 0, type: 'corridor' },
    { id: 'loc_1785552600163', name: "It building", x: 30.35, y: -0.19, z: -135.73, type: 'corridor' },
    { id: 'loc_1785552662392', name: "Ssk building", x: 87.38, y: 0.13, z: -144.43, type: 'corridor' },
    { id: 'loc_1786042634820', name: "216", x: 0.01, y: 0.03, z: 0.05, type: 'room' },
    { id: 'loc_1786042684611', name: "2nd floor stairs base", x: 1.47, y: 0.05, z: -16.93, type: 'corridor' },
    { id: 'loc_1786042711629', name: "2nd floor stairs mid", x: -2.77, y: 1.22, z: -16.66, type: 'stairs' },
    { id: 'loc_1786042746410', name: "2nd mid", x: -2.88, y: 2.12, z: -13.39, type: 'stairs' },
    { id: 'loc_1786042772082', name: "3rd floor base", x: 0.57, y: 3.16, z: -13.18, type: 'corridor' },
    { id: 'loc_1786042792588', name: "312", x: 1.92, y: 3.11, z: -21.5, type: 'room' },
    { id: 'loc_1786093131841', name: "IT LAB 8", x: 2.92, y: 2.46, z: -4.91, type: 'room' },
    { id: 'loc_1786093163510', name: "IT 2nd floor stairs base", x: 3.98, y: 2.44, z: -3.89, type: 'room' },
    { id: 'loc_1786093197762', name: "IT 2nd floor", x: 0.59, y: 3.62, z: 0.05, type: 'corridor' },
    { id: 'loc_1786093216768', name: "IT 309", x: -2.24, y: 3.65, z: 0.25, type: 'room' },
    { id: 'loc_1786093240458', name: "IT LAB 6", x: -2.01, y: 3.65, z: -1.55, type: 'room' },
    { id: 'loc_1786097730344', name: "IT 1st Floor", x: 0.52, y: 2.96, z: -11.88, type: 'corridor' },
    { id: 'loc_1786097774060', name: "1st floor stairs base", x: -0.66, y: 2.99, z: -10.68, type: 'stairs' },
    { id: 'loc_1786097850965', name: "IT LAB 8", x: -1.14, y: 4.07, z: -5.65, type: 'room' },
    { id: 'loc_1786097877406', name: "2nd floor stairs base", x: -2.42, y: 4.03, z: -6.77, type: 'stairs' },
    { id: 'loc_1786097911927', name: "IT 3rd floor", x: -2.76, y: 5.19, z: -10.94, type: 'corridor' },
    { id: 'loc_1786097931983', name: "IT LAB 6", x: 0.56, y: 5.2, z: -11.78, type: 'room' },
    { id: 'loc_1786097960499', name: "IT 309", x: -0.77, y: 5.22, z: -13.02, type: 'room' },
    { id: 'loc_1786098000173', name: "4th floor base", x: -0.98, y: 5.19, z: -10.63, type: 'stairs' },
    { id: 'loc_1786098029386', name: "Ms Noor Ul Huda Office", x: -1.26, y: 7.5, z: -5.79, type: 'room' },
    { id: 'loc_1786098053217', name: "5th floor base", x: -2.5, y: 7.46, z: -6.94, type: 'stairs' },
    { id: 'loc_1786098074100', name: "5th floor", x: -2.49, y: 8.6, z: -11.48, type: 'corridor' },
    { id: 'loc_1786098096450', name: "6th floor base", x: -1.11, y: 8.63, z: -10.27, type: 'corridor' },
    { id: 'loc_1786098130968', name: "IT lab 11", x: -1.53, y: 10.15, z: -4.35, type: 'room' },
    { id: 'loc_1786098149277', name: "IT LAB 12", x: -7.29, y: 10.14, z: -4.07, type: 'room' },
    { id: 'loc_1786180770962', name: "IT Main gate", x: 0.01, y: 0.01, z: -0.03, type: 'corridor' },
    { id: 'loc_1786180792269', name: "Lift", x: 0.13, y: -0.05, z: -11.76, type: 'room' },
    { id: 'loc_1786180816980', name: "LAB 1", x: -5.02, y: -0.73, z: -15, type: 'room' },
    { id: 'loc_1786181034367', name: "Main gate 1", x: 0.01, y: 0.02, z: 0.06, type: 'corridor' },
    { id: 'loc_1786181053584', name: "Basement stairs", x: -0.31, y: -0.14, z: -10.42, type: 'stairs' },
    { id: 'loc_1786181085503', name: "Basement stairs mid", x: -4.92, y: 2.15, z: -14.39, type: 'stairs' },
    { id: 'loc_1786181116517', name: "IT 204", x: 0.72, y: 2.7, z: -8.88, type: 'room' },
    { id: 'loc_1786181858918', name: "Lab 01", x: 0.01, y: 0.07, z: 0.09, type: 'room' },
    { id: 'loc_1786181877174', name: "Lab 02", x: -0.95, y: -0.04, z: -5.49, type: 'room' },
    { id: 'loc_1786181894058', name: "Lab 3", x: 6.41, y: 0.1, z: -9.03, type: 'room' },
    { id: 'loc_1786439204728', name: "Admin", x: 0.03, y: 0, z: -0.01, type: 'corridor' },
    { id: 'loc_1786442403186', name: "Admin lobby hub", x: 0.02, y: 0.01, z: 0.07, type: 'corridor' },
    { id: 'loc_1786442420219', name: "Procurement department", x: -2.11, y: 0.06, z: 0.01, type: 'room' },
    { id: 'loc_1786442448601', name: "Admin stairs base", x: -2.98, y: 0.09, z: -9.76, type: 'stairs' },
    { id: 'loc_1786442469732', name: "admin stairs mid", x: -5.41, y: 1.84, z: -13.8, type: 'stairs' },
    { id: 'loc_1786442496579', name: "Admin first floor", x: -2.02, y: 3.57, z: -10.31, type: 'corridor' },
    { id: 'loc_1786442514178', name: "Finance department", x: -1.78, y: 3.54, z: -7.08, type: 'room' },
    { id: 'loc_1786442533496', name: "Registrar office", x: -1.74, y: 3.54, z: -2.16, type: 'room' },
    { id: 'loc_1786442585571', name: "Admin 1st mid", x: 0.14, y: 3.5, z: -3.63, type: 'corridor' },
    { id: 'loc_1786442599987', name: "Admin room", x: 4.41, y: 3.51, z: -1.76, type: 'room' },
    { id: 'loc_1786442616842', name: "Scholarship office", x: 4.98, y: 3.48, z: -6.37, type: 'room' },
    { id: 'loc_1786442679642', name: "Admissions office", x: 4.2, y: 0.05, z: -0.1, type: 'room' },
    { id: 'loc_1786442693890', name: "Rector office", x: 5.09, y: 0.12, z: -2.65, type: 'room' },
    { id: 'loc_1786442746502', name: "Admin gate", x: -0.52, y: 0.07, z: 5.66, type: 'exit' },
    { id: 'loc_1786530875903', name: "Route 2 stairs base", x: 0.29, y: 0.07, z: -5.89, type: 'stairs' },
    { id: 'loc_1786530903612', name: "Route 2 stairs mid", x: 3.11, y: 1.61, z: -10.38, type: 'stairs' },
    { id: 'loc_1786530931782', name: "Route 2 first floor", x: -0.72, y: 3.38, z: -7.35, type: 'corridor' },
    { id: 'loc_1787047494473', name: "Admin First Corner", x: 0.53, y: 0.04, z: -7.19, type: 'corridor' },
    { id: 'loc_1787136122867', name: "Admin u turn", x: -0.73, y: 0.12, z: -1.14, type: 'corridor' },
    { id: 'loc_1787136146371', name: "Placement office", x: -5.16, y: 0.54, z: 4.04, type: 'room' },
    { id: 'loc_1789544096033', name: "Ground floor", x: 0.12, y: -0.07, z: -0.12, type: 'corridor' },
    { id: 'loc_1789544122937', name: "Atm", x: 0.18, y: 0.21, z: -2.08, type: 'room' },
    { id: 'lobby_f1', name: "Lobby Floor 1", x: 0, y: 0, z: 0, type: 'corridor' },
    { id: 'room_101', name: "Room 101 (F1)", x: 3, y: 0, z: 2, type: 'room' },
    { id: 'stairs_f1', name: "Stairs Floor 1", x: 0, y: 0, z: 10, type: 'stairs' },
    { id: 'stairs_f2', name: "Stairs Floor 2", x: 0, y: 4, z: 10, type: 'stairs' },
    { id: 'lobby_f2', name: "Lobby Floor 2", x: 0, y: 4, z: 0, type: 'corridor' },
    { id: 'room_201', name: "Room 201 (F2)", x: -3, y: 4, z: -2, type: 'room' },
    { id: 'stairs_f3', name: "Stairs Floor 3", x: 0, y: 8, z: 10, type: 'stairs' },
    { id: 'room_301', name: "Room 301 (F3)", x: 4, y: 8, z: 5, type: 'room' },
    { id: 'it301', name: "IT-301 Lab", x: 0, y: 0, z: 0, type: 'room' },
    { id: 'it_corr', name: "IT Corridor Start", x: 0, y: 0, z: 5, type: 'corridor' },
    { id: 'it302', name: "IT-302 Lab", x: 4, y: 0, z: 5, type: 'room' },
    { id: 'stairs3', name: "Stairs 3rd Floor", x: -5, y: 0, z: 15, type: 'stairs' },
    { id: 'cs_fac', name: "CS Department Faculty", x: 2, y: 0, z: 15, type: 'room' },
    { id: 'entrance', name: "Entrance", x: 0.03, y: 0, z: 0.01, type: 'room' },
    { id: 'exit', name: "Exit", x: 2.76, y: 0, z: 0.9, type: 'room' },
    { id: 'bkt', name: "Barkat", x: 0, y: 0, z: 0, type: 'room' },
    { id: 'rlx', name: "ROLEX", x: 0, y: 0, z: -4, type: 'room' },
    { id: 'it_gate', name: "IT Main Gate", x: 0, y: 0, z: 0, type: 'room' },
    { id: 'lift_1', name: "The Lift", x: 0, y: 0, z: -12.5, type: 'corridor' },
    { id: 'it_lab_1', name: "IT Lab 1", x: 3, y: 0, z: -12.5, type: 'room' },
    { id: 'it_main_gate_1', name: "IT Main gate 1", x: 0, y: 0, z: 0, type: 'room' },
    { id: 'stairs_1_base', name: "Stairs 1 base", x: -2.5, y: 0, z: -12.5, type: 'stairs' },
    { id: 'stairs_1_midway', name: "Stairs 1 midway", x: -3.8, y: 2, z: -15.5, type: 'stairs' },
    { id: 'first_floor', name: "1st floor", x: -2.5, y: 3.8, z: -12.5, type: 'corridor' },
    { id: 'room_204', name: "Room 204", x: 0, y: 3.8, z: -9, type: 'room' },
    { id: 'lab_4', name: "Lab 4", x: -4.5, y: 3.8, z: -10, type: 'room' },
    { id: 'stairs_2_base', name: "Stairs 2 base", x: -2.5, y: 3.8, z: -12.5, type: 'stairs' },
    { id: 'lab_8', name: "Lab 8", x: -4.5, y: 6, z: -17, type: 'room' },
    { id: 'lab_9', name: "Lab 9", x: -1.5, y: 6, z: -21, type: 'room' },
    { id: 'lab_10', name: "Lab 10", x: 3.5, y: 6, z: -18, type: 'room' },
  ];
};

export const getAllEdges = () => {
  return [
    { id: 1, node1_id: 'loc_1783705414239', node2_id: 'loc_1783705445555', distance: 4.51 },
    { id: 2, node1_id: 'loc_1783705445555', node2_id: 'loc_1783705474966', distance: 3.5 },
    { id: 3, node1_id: 'loc_1783705474966', node2_id: 'loc_1783705505137', distance: 3.5 },
    { id: 4, node1_id: 'loc_1783705505137', node2_id: 'loc_1783705529988', distance: 3.03 },
    { id: 5, node1_id: 'loc_1783705529988', node2_id: 'loc_1783705554117', distance: 7.06 },
    { id: 6, node1_id: 'loc_1783772308590', node2_id: 'loc_1783772346535', distance: 9.49 },
    { id: 7, node1_id: 'loc_1783772346535', node2_id: 'loc_1783772367978', distance: 3.11 },
    { id: 8, node1_id: 'loc_1783772367978', node2_id: 'loc_1783772390844', distance: 4.73 },
    { id: 9, node1_id: 'loc_1785552600163', node2_id: 'loc_1785552662392', distance: 57.69 },
    { id: 10, node1_id: 'loc_1786042634820', node2_id: 'loc_1786042684611', distance: 17.04 },
    { id: 11, node1_id: 'loc_1786042684611', node2_id: 'loc_1786042711629', distance: 4.4 },
    { id: 12, node1_id: 'loc_1786042711629', node2_id: 'loc_1786042746410', distance: 3.39 },
    { id: 13, node1_id: 'loc_1786042746410', node2_id: 'loc_1786042772082', distance: 3.6 },
    { id: 14, node1_id: 'loc_1786042772082', node2_id: 'loc_1786042792588', distance: 8.43 },
    { id: 15, node1_id: 'loc_1786093131841', node2_id: 'loc_1786093163510', distance: 1.47 },
    { id: 16, node1_id: 'loc_1786093163510', node2_id: 'loc_1786093197762', distance: 5.32 },
    { id: 17, node1_id: 'loc_1786093197762', node2_id: 'loc_1786093216768', distance: 2.84 },
    { id: 18, node1_id: 'loc_1786093216768', node2_id: 'loc_1786093240458', distance: 1.82 },
    { id: 19, node1_id: 'loc_1786097730344', node2_id: 'loc_1786097774060', distance: 1.68 },
    { id: 20, node1_id: 'loc_1786097774060', node2_id: 'loc_1786097850965', distance: 5.17 },
    { id: 21, node1_id: 'loc_1786097850965', node2_id: 'loc_1786097877406', distance: 1.7 },
    { id: 22, node1_id: 'loc_1786097877406', node2_id: 'loc_1786097911927', distance: 4.34 },
    { id: 23, node1_id: 'loc_1786097911927', node2_id: 'loc_1786097931983', distance: 3.43 },
    { id: 24, node1_id: 'loc_1786097931983', node2_id: 'loc_1786097960499', distance: 1.82 },
    { id: 25, node1_id: 'loc_1786097960499', node2_id: 'loc_1786098000173', distance: 2.39 },
    { id: 26, node1_id: 'loc_1786098000173', node2_id: 'loc_1786098029386', distance: 5.38 },
    { id: 27, node1_id: 'loc_1786098029386', node2_id: 'loc_1786098053217', distance: 1.69 },
    { id: 28, node1_id: 'loc_1786098053217', node2_id: 'loc_1786098074100', distance: 4.68 },
    { id: 29, node1_id: 'loc_1786098074100', node2_id: 'loc_1786098096450', distance: 1.84 },
    { id: 30, node1_id: 'loc_1786098096450', node2_id: 'loc_1786098130968', distance: 6.12 },
    { id: 31, node1_id: 'loc_1786098130968', node2_id: 'loc_1786098149277', distance: 5.76 },
    { id: 32, node1_id: 'loc_1786180770962', node2_id: 'loc_1786180792269', distance: 11.73 },
    { id: 33, node1_id: 'loc_1786180792269', node2_id: 'loc_1786180816980', distance: 6.12 },
    { id: 34, node1_id: 'loc_1786181034367', node2_id: 'loc_1786181053584', distance: 10.49 },
    { id: 35, node1_id: 'loc_1786181053584', node2_id: 'loc_1786181085503', distance: 6.5 },
    { id: 36, node1_id: 'loc_1786181085503', node2_id: 'loc_1786181116517', distance: 7.91 },
    { id: 37, node1_id: 'loc_1786180792269', node2_id: 'loc_1786181053584', distance: 1.4 },
    { id: 38, node1_id: 'loc_1786181858918', node2_id: 'loc_1786181877174', distance: 5.67 },
    { id: 39, node1_id: 'loc_1786181877174', node2_id: 'loc_1786181894058', distance: 8.17 },
    { id: 40, node1_id: 'loc_1786442403186', node2_id: 'loc_1786442420219', distance: 2.13 },
    { id: 41, node1_id: 'loc_1786442420219', node2_id: 'loc_1786442448601', distance: 9.81 },
    { id: 42, node1_id: 'loc_1786442448601', node2_id: 'loc_1786442469732', distance: 5.03 },
    { id: 43, node1_id: 'loc_1786442496579', node2_id: 'loc_1786442514178', distance: 3.24 },
    { id: 44, node1_id: 'loc_1786442514178', node2_id: 'loc_1786442533496', distance: 4.92 },
    { id: 45, node1_id: 'loc_1786442585571', node2_id: 'loc_1786442599987', distance: 4.66 },
    { id: 46, node1_id: 'loc_1786442599987', node2_id: 'loc_1786442616842', distance: 4.65 },
    { id: 47, node1_id: 'loc_1786442403186', node2_id: 'loc_1786442679642', distance: 4.19 },
    { id: 48, node1_id: 'loc_1786442679642', node2_id: 'loc_1786442693890', distance: 2.71 },
    { id: 49, node1_id: 'loc_1786442403186', node2_id: 'loc_1786442746502', distance: 5.62 },
    { id: 50, node1_id: 'loc_1786442469732', node2_id: 'loc_1786442496579', distance: 5.17 },
    { id: 51, node1_id: 'loc_1786442693890', node2_id: 'loc_1786530875903', distance: 5.79 },
    { id: 52, node1_id: 'loc_1786530875903', node2_id: 'loc_1786530903612', distance: 5.52 },
    { id: 53, node1_id: 'loc_1786530903612', node2_id: 'loc_1786530931782', distance: 5.2 },
    { id: 54, node1_id: 'loc_1786442514178', node2_id: 'loc_1786442585571', distance: 3.95 },
    { id: 55, node1_id: 'loc_1786442533496', node2_id: 'loc_1786442585571', distance: 2.39 },
    { id: 56, node1_id: 'loc_1786442496579', node2_id: 'loc_1787047494473', distance: 5.36 },
    { id: 57, node1_id: 'loc_1787047494473', node2_id: 'loc_1786442585571', distance: 4.98 },
    { id: 58, node1_id: 'loc_1786442496579', node2_id: 'loc_1787136122867', distance: 9.89 },
    { id: 59, node1_id: 'loc_1787136122867', node2_id: 'loc_1787136146371', distance: 6.83 },
    { id: 60, node1_id: 'room_101', node2_id: 'lobby_f1', distance: 3.6 },
    { id: 61, node1_id: 'lobby_f1', node2_id: 'stairs_f1', distance: 10 },
    { id: 62, node1_id: 'stairs_f1', node2_id: 'stairs_f2', distance: 5.6 },
    { id: 63, node1_id: 'stairs_f2', node2_id: 'lobby_f2', distance: 10 },
    { id: 64, node1_id: 'lobby_f2', node2_id: 'room_201', distance: 3.6 },
    { id: 65, node1_id: 'stairs_f2', node2_id: 'stairs_f3', distance: 5.6 },
    { id: 66, node1_id: 'stairs_f3', node2_id: 'room_301', distance: 6.4 },
    { id: 67, node1_id: 'it301', node2_id: 'it_corr', distance: 5 },
    { id: 68, node1_id: 'it_corr', node2_id: 'it302', distance: 4 },
    { id: 69, node1_id: 'it_corr', node2_id: 'stairs3', distance: 11.2 },
    { id: 70, node1_id: 'stairs3', node2_id: 'cs_fac', distance: 7 },
    { id: 71, node1_id: 'entrance', node2_id: 'exit', distance: 2.9 },
    { id: 72, node1_id: 'bkt', node2_id: 'rlx', distance: 3 },
    { id: 73, node1_id: 'it_gate', node2_id: 'lift_1', distance: 12.5 },
    { id: 74, node1_id: 'lift_1', node2_id: 'it_lab_1', distance: 6.5 },
    { id: 75, node1_id: 'it_gate', node2_id: 'it_main_gate_1', distance: 0.1 },
    { id: 76, node1_id: 'it_main_gate_1', node2_id: 'lift_1', distance: 12.5 },
    { id: 77, node1_id: 'stairs_1_base', node2_id: 'lift_1', distance: 0.5 },
    { id: 78, node1_id: 'stairs_1_base', node2_id: 'it_lab_1', distance: 6.5 },
    { id: 79, node1_id: 'it_main_gate_1', node2_id: 'stairs_1_base', distance: 12.32 },
    { id: 80, node1_id: 'stairs_1_base', node2_id: 'stairs_1_midway', distance: 5.67 },
    { id: 81, node1_id: 'stairs_1_midway', node2_id: 'first_floor', distance: 4.83 },
    { id: 82, node1_id: 'first_floor', node2_id: 'room_204', distance: 3.5 },
    { id: 83, node1_id: 'first_floor', node2_id: 'lab_4', distance: 2.73 },
    { id: 84, node1_id: 'first_floor', node2_id: 'stairs_2_base', distance: 0.75 },
    { id: 85, node1_id: 'stairs_2_base', node2_id: 'lab_8', distance: 7.72 },
    { id: 86, node1_id: 'lab_8', node2_id: 'lab_9', distance: 5.78 },
    { id: 87, node1_id: 'lab_8', node2_id: 'lab_10', distance: 11.69 },
  ];
};

// Web Mock
export const addNode = () => {};
export const addEdge = () => {};

export const saveUserProfile = (name, email, role) => {
  console.log("Mock Save User Profile on Web:", name, email, role);
  try {
    const usersData = localStorage.getItem('web_users');
    const users = usersData ? JSON.parse(usersData) : [];
    
    const idx = users.findIndex(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (idx >= 0) {
      users[idx] = { name, email, role };
    } else {
      users.push({ name, email, role });
    }
    
    localStorage.setItem('web_users', JSON.stringify(users));
    localStorage.setItem('active_user_email', email);
  } catch (e) {}
};

export const getUniqueUserCount = () => {
  try {
    const usersData = localStorage.getItem('web_users');
    const users = usersData ? JSON.parse(usersData) : [];
    return users.length;
  } catch (e) {
    return 0;
  }
};

export const getUserProfile = () => {
  try {
    const activeEmail = localStorage.getItem('active_user_email');
    if (!activeEmail) return null;
    const usersData = localStorage.getItem('web_users');
    const users = usersData ? JSON.parse(usersData) : [];
    return users.find(u => u.email.trim().toLowerCase() === activeEmail.trim().toLowerCase()) || null;
  } catch (e) {
    return null;
  }
};

export const findProfileByEmail = (email) => {
  try {
    const usersData = localStorage.getItem('web_users');
    const users = usersData ? JSON.parse(usersData) : [];
    return users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase()) || null;
  } catch (e) {
    return null;
  }
};

export const addOCRLog = (imagePath, rawText, matchedName) => {
  try {
    const logs = JSON.parse(localStorage.getItem('ocr_logs') || '[]');
    logs.push({
      id: Date.now(),
      image_path: imagePath,
      raw_text: rawText || '',
      matched_name: matchedName || '',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('ocr_logs', JSON.stringify(logs));
  } catch (e) {}
};

export const getOCRLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('ocr_logs') || '[]').reverse();
  } catch (e) {
    return [];
  }
};

export const clearOCRLogs = () => {
  try {
    localStorage.removeItem('ocr_logs');
  } catch (e) {}
};

export const getActiveUserEmail = () => {
  const profile = getUserProfile();
  return profile ? profile.email : 'guest';
};

// ── Favorites / Bookmarks Mock ─────────────────────────────────────────────
export const getFavorites = () => {
  try {
    const email = getActiveUserEmail();
    const favs = JSON.parse(localStorage.getItem('user_favorites_' + email) || '[]');
    const all = getAllNodes();
    return all.filter(n => favs.includes(n.id));
  } catch (e) {
    return [];
  }
};

export const addFavorite = (nodeId) => {
  try {
    const email = getActiveUserEmail();
    const favs = JSON.parse(localStorage.getItem('user_favorites_' + email) || '[]');
    if (!favs.includes(nodeId)) {
      favs.push(nodeId);
      localStorage.setItem('user_favorites_' + email, JSON.stringify(favs));
    }
  } catch (e) {}
};

export const removeFavorite = (nodeId) => {
  try {
    const email = getActiveUserEmail();
    let favs = JSON.parse(localStorage.getItem('user_favorites_' + email) || '[]');
    favs = favs.filter(id => id !== nodeId);
    localStorage.setItem('user_favorites_' + email, JSON.stringify(favs));
  } catch (e) {}
};

export const isFavorite = (nodeId) => {
  try {
    const email = getActiveUserEmail();
    const favs = JSON.parse(localStorage.getItem('user_favorites_' + email) || '[]');
    return favs.includes(nodeId);
  } catch (e) {
    return false;
  }
};

// ── Navigation Metrics Mock ────────────────────────────────────────────────
export const addNavigationMetric = (distance, startName, endName) => {
  try {
    const email = getActiveUserEmail();
    const metrics = JSON.parse(localStorage.getItem('navigation_metrics_' + email) || '[]');
    metrics.push({
      distance,
      timestamp: new Date().toISOString(),
      start_name: startName || null,
      end_name: endName || null
    });
    localStorage.setItem('navigation_metrics_' + email, JSON.stringify(metrics));
  } catch (e) {}
};

export const getRecentTracks = () => {
  try {
    const email = getActiveUserEmail();
    return JSON.parse(localStorage.getItem('navigation_metrics_' + email) || '[]').reverse().slice(0, 10);
  } catch (e) {
    return [];
  }
};

export const clearRecentTracks = () => {
  try {
    const email = getActiveUserEmail();
    localStorage.removeItem('navigation_metrics_' + email);
  } catch (e) {}
};

export const getLifetimeMetrics = () => {
  try {
    const email = getActiveUserEmail();
    const metrics = JSON.parse(localStorage.getItem('navigation_metrics_' + email) || '[]');
    const totalDist = metrics.reduce((sum, m) => sum + m.distance, 0);
    const totalRuns = metrics.length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDist = metrics
      .filter(m => m.timestamp.startsWith(todayStr))
      .reduce((sum, m) => sum + m.distance, 0);

    return {
      totalDistance: parseFloat(totalDist.toFixed(1)),
      totalRuns,
      todayDistance: parseFloat(todayDist.toFixed(1))
    };
  } catch (e) {
    return { totalDistance: 0, totalRuns: 0, todayDistance: 0 };
  }
};

export const getWeeklyMetrics = () => {
  const list = [];
  try {
    const email = getActiveUserEmail();
    const metrics = JSON.parse(localStorage.getItem('navigation_metrics_' + email) || '[]');
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const total = metrics
        .filter(m => m.timestamp.startsWith(dateStr))
        .reduce((sum, m) => sum + m.distance, 0);
        
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      list.push({
        day: dayName,
        date: dateStr,
        distance: parseFloat(total.toFixed(1))
      });
    }
  } catch (e) {}
  return list;
};

export const deleteUserProfile = () => {
  try {
    localStorage.removeItem('active_user_email');
  } catch (e) {}
};

export const clearAllFavorites = () => {
  try {
    const email = getActiveUserEmail();
    localStorage.removeItem('user_favorites_' + email);
  } catch (e) {}
};


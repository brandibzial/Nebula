// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title NebulaResumeFHE
 * @notice 功能与 ChainResumeFHE 等价，但更名并调整方法命名：
 *  - Profile 与 Milestone 表达相同概念（简历与经历）
 *  - 声誉与私密备注的 FHE 读写保持一致
 */
contract NebulaResumeFHE is ZamaEthereumConfig {
    struct Experience {
        string company;
        string position;
        string description;
        uint256 startDate;
        uint256 endDate;
        string proofCID;
        bool verified;
        address verifier;
    }

    struct Resume {
        uint256 id;
        address owner;
        string metadataCID;
        Experience[] experiences;
    }

    mapping(uint256 => Resume) private _resumes;
    mapping(address => uint256[]) private _userResumes;
    uint256 public resumeCount;

    mapping(uint256 => euint32) private _endorsementScore;
    mapping(uint256 => euint64) private _privateNote;

    event ProfileCreated(uint256 indexed id, address indexed owner);
    event MilestoneAdded(uint256 indexed id, string company);
    event MilestoneVerified(uint256 indexed id, uint256 index, address verifier);
    event ProfileUpdated(uint256 indexed id);
    event ReputationChanged(uint256 indexed id);
    event PrivateMemoUpdated(uint256 indexed id);

    modifier onlyOwnerOf(uint256 resumeId) {
        require(_resumes[resumeId].owner == msg.sender, "Not owner");
        _;
    }

    // 原 createResume
    function createProfile(string calldata metadataCID) external returns (uint256) {
        resumeCount++;
        uint256 id = resumeCount;
        Resume storage r = _resumes[id];
        r.id = id;
        r.owner = msg.sender;
        r.metadataCID = metadataCID;
        _userResumes[msg.sender].push(id);
        emit ProfileCreated(id, msg.sender);
        return id;
    }

    // 原 addExperience
    function addMilestone(
        uint256 resumeId,
        string calldata company,
        string calldata position,
        string calldata description,
        uint256 startDate,
        uint256 endDate,
        string calldata proofCID
    ) external onlyOwnerOf(resumeId) {
        Resume storage r = _resumes[resumeId];
        r.experiences.push(
            Experience(company, position, description, startDate, endDate, proofCID, false, address(0))
        );
        emit MilestoneAdded(resumeId, company);
    }

    // 原 verifyExperience
    function verifyMilestone(uint256 resumeId, uint256 index) external {
        Experience storage exp = _resumes[resumeId].experiences[index];
        exp.verified = true;
        exp.verifier = msg.sender;
        emit MilestoneVerified(resumeId, index, msg.sender);
    }

    // 原 updateResume
    function updateProfile(uint256 resumeId, string calldata newCID) external onlyOwnerOf(resumeId) {
        _resumes[resumeId].metadataCID = newCID;
        emit ProfileUpdated(resumeId);
    }

    // 原 incrementScore
    function increaseReputation(uint256 resumeId, externalEuint32 input, bytes calldata inputProof)
        external
        onlyOwnerOf(resumeId)
    {
        euint32 v = FHE.fromExternal(input, inputProof);
        _endorsementScore[resumeId] = FHE.add(_endorsementScore[resumeId], v);
        FHE.allowThis(_endorsementScore[resumeId]);
        FHE.allow(_endorsementScore[resumeId], _resumes[resumeId].owner);
        emit ReputationChanged(resumeId);
    }

    // 原 decrementScore
    function decreaseReputation(uint256 resumeId, externalEuint32 input, bytes calldata inputProof)
        external
        onlyOwnerOf(resumeId)
    {
        euint32 v = FHE.fromExternal(input, inputProof);
        _endorsementScore[resumeId] = FHE.sub(_endorsementScore[resumeId], v);
        FHE.allowThis(_endorsementScore[resumeId]);
        FHE.allow(_endorsementScore[resumeId], _resumes[resumeId].owner);
        emit ReputationChanged(resumeId);
    }

    // 原 getScore
    function getReputation(uint256 resumeId) external view returns (euint32) {
        return _endorsementScore[resumeId];
    }

    // 原 setPrivateNote
    function setPrivateMemo(uint256 resumeId, externalEuint64 note, bytes calldata inputProof)
        external
        onlyOwnerOf(resumeId)
    {
        euint64 v = FHE.fromExternal(note, inputProof);
        _privateNote[resumeId] = v;
        FHE.allowThis(_privateNote[resumeId]);
        FHE.allow(_privateNote[resumeId], _resumes[resumeId].owner);
        emit PrivateMemoUpdated(resumeId);
    }

    // 原 getPrivateNote
    function getPrivateMemo(uint256 resumeId) external view returns (euint64) {
        return _privateNote[resumeId];
    }

    // 原 allowDecrypt
    function grantDecryption(uint256 resumeId, address to) external onlyOwnerOf(resumeId) {
        FHE.allow(_endorsementScore[resumeId], to);
        FHE.allow(_privateNote[resumeId], to);
    }

    // 原 getResume
    function getProfile(uint256 resumeId) external view returns (Resume memory) {
        return _resumes[resumeId];
    }

    // 原 getUserResumes
    function getProfilesByUser(address user) external view returns (uint256[] memory) {
        return _userResumes[user];
    }
}




